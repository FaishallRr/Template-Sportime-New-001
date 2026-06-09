package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type TripayConfig struct {
	APIKey       string
	PrivateKey   string
	MerchantCode string
	IsProduction bool
}

type TripayClient struct {
	config TripayConfig
	client *http.Client
}

func NewTripayClient() *TripayClient {
	cfg := TripayConfig{
		APIKey:       os.Getenv("TRIPAY_API_KEY"),
		PrivateKey:   os.Getenv("TRIPAY_PRIVATE_KEY"),
		MerchantCode: os.Getenv("TRIPAY_MERCHANT_CODE"),
		IsProduction: os.Getenv("TRIPAY_IS_PRODUCTION") == "true",
	}
	return &TripayClient{
		config: cfg,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (t *TripayClient) baseURL() string {
	if t.config.IsProduction {
		return "https://tripay.co.id/api"
	}
	return "https://tripay.co.id/api-sandbox"
}

func (t *TripayClient) generateSignature(merchantRef string, amount int64) string {
	data := t.config.MerchantCode + merchantRef + fmt.Sprintf("%d", amount)
	mac := hmac.New(sha256.New, []byte(t.config.PrivateKey))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}

type TripayTransactionRequest struct {
	Method        string       `json:"method"`
	MerchantRef   string       `json:"merchant_ref"`
	Amount        int64        `json:"amount"`
	CustomerName  string       `json:"customer_name"`
	CustomerEmail string       `json:"customer_email"`
	CustomerPhone string       `json:"customer_phone"`
	OrderItems    []TripayItem `json:"order_items"`
	ReturnURL     string       `json:"return_url"`
	ExpiryTime    time.Time    `json:"expiry_time"`
	Signature     string       `json:"signature"`
}

type TripayItem struct {
	Sku      string `json:"sku"`
	Name     string `json:"name"`
	Price    int64  `json:"price"`
	Quantity int    `json:"quantity"`
}

type TripayResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    *TripayData `json:"data,omitempty"`
}

type TripayData struct {
	Reference     string `json:"reference"`
	MerchantRef   string `json:"merchant_ref"`
	PaymentMethod string `json:"payment_method"`
	PaymentName   string `json:"payment_name"`
	CustomerName  string `json:"customer_name"`
	TotalAmount   int64  `json:"total_amount"`
	FeeAmount     int64  `json:"fee_amount"`
	PayCode       string `json:"pay_code"`
	CheckoutURL   string `json:"checkout_url"`
	ExpiryTime    string `json:"expiry_time"`
	QrString      string `json:"qr_string"`
	QrURL         string `json:"qr_url"`
}

func (t *TripayClient) CreateTransaction(req TripayTransactionRequest) (*TripayData, error) {
	req.Signature = t.generateSignature(req.MerchantRef, req.Amount)

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", t.baseURL()+"/transaction/create", strings.NewReader(string(body)))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+t.config.APIKey)

	resp, err := t.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var result TripayResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("tripay error: %s", result.Message)
	}

	return result.Data, nil
}

func (t *TripayClient) ValidateCallback(signature, merchantRef, event string, amount int64) bool {
	data := t.config.MerchantCode + merchantRef + fmt.Sprintf("%d", amount) + event + t.config.PrivateKey
	mac := hmac.New(sha256.New, []byte(t.config.PrivateKey))
	mac.Write([]byte(data))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expected))
}

type TripayCallbackBody struct {
	Reference     string `json:"reference"`
	MerchantRef   string `json:"merchant_ref"`
	PaymentMethod string `json:"payment_method"`
	PaymentName   string `json:"payment_name"`
	CustomerName  string `json:"customer_name"`
	TotalAmount   int64  `json:"total_amount"`
	FeeAmount     int64  `json:"fee_amount"`
	Status        string `json:"status"`
	PaidAt        string `json:"paid_at"`
}

func (t *TripayClient) GetPaymentChannels() ([]TripayChannel, error) {
	req, err := http.NewRequest("GET", t.baseURL()+"/merchant/payment-channel", nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+t.config.APIKey)

	resp, err := t.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var result struct {
		Success bool            `json:"success"`
		Data    []TripayChannel `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	return result.Data, nil
}

type TripayChannel struct {
	Group   string `json:"group"`
	Code    string `json:"code"`
	Name    string `json:"name"`
	Type    string `json:"type"`
	Fee     string `json:"fee"`
	IconURL string `json:"icon_url"`
	Active  bool   `json:"active"`
}

// ClosePayment closes an open payment (for QRIS/paycode that wasn't paid)
func (t *TripayClient) ClosePayment(reference string) error {
	data := url.Values{}
	data.Set("reference", reference)

	req, err := http.NewRequest("POST", t.baseURL()+"/transaction/close", strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Bearer "+t.config.APIKey)

	resp, err := t.client.Do(req)
	if err != nil {
		return fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read response: %w", err)
	}

	var result TripayResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return fmt.Errorf("unmarshal response: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("close payment failed: %s", result.Message)
	}
	return nil
}

// GetTransactionDetail gets details of a specific transaction by reference
func (t *TripayClient) GetTransactionDetail(reference string) (*TripayData, error) {
	url := t.baseURL() + "/transaction/detail?reference=" + reference
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+t.config.APIKey)

	resp, err := t.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var result TripayResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("tripay error: %s", result.Message)
	}
	return result.Data, nil
}
