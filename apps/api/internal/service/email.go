package service

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
)

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	FromAddress  string
	FromName     string
}

type EmailService struct {
	config EmailConfig
}

func NewEmailService(cfg EmailConfig) *EmailService {
	return &EmailService{config: cfg}
}

func (s *EmailService) IsConfigured() bool {
	return s.config.SMTPHost != "" && s.config.SMTPUser != ""
}

func (s *EmailService) SendBookingConfirmation(toEmail, toName, courtName, dateStr, invoiceURL string) {
	if !s.IsConfigured() {
		log.Println("[Email] Not configured, skipping")
		return
	}

	subject := fmt.Sprintf("Booking Confirmation - %s", courtName)
	body := fmt.Sprintf(`Dear %s,

Your booking at %s for %s has been confirmed.

Date: %s
Invoice: %s

Thank you for choosing SportTime!`, toName, courtName, courtName, dateStr, invoiceURL)

	msg := fmt.Sprintf("From: %s <%s>\r\nTo: %s <%s>\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		s.config.FromName, s.config.FromAddress, toName, toEmail, subject, body)

	addr := fmt.Sprintf("%s:%s", s.config.SMTPHost, s.config.SMTPPort)

	if s.config.SMTPPort == "465" {
		tlsConfig := &tls.Config{ServerName: s.config.SMTPHost}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			log.Printf("[Email] TLS dial failed: %v", err)
			return
		}
		client, err := smtp.NewClient(conn, s.config.SMTPHost)
		if err != nil {
			log.Printf("[Email] SMTP client failed: %v", err)
			return
		}
		defer client.Close()
		if err := client.Auth(smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPHost)); err != nil {
			log.Printf("[Email] Auth failed: %v", err)
			return
		}
		if err := client.Mail(s.config.FromAddress); err != nil {
			log.Printf("[Email] Mail from failed: %v", err)
			return
		}
		if err := client.Rcpt(toEmail); err != nil {
			log.Printf("[Email] Rcpt failed: %v", err)
			return
		}
		w, err := client.Data()
		if err != nil {
			log.Printf("[Email] Data failed: %v", err)
			return
		}
		_, err = w.Write([]byte(msg))
		if err != nil {
			log.Printf("[Email] Write failed: %v", err)
			return
		}
		w.Close()
	} else {
		auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPHost)
		if err := smtp.SendMail(addr, auth, s.config.FromAddress, []string{toEmail}, []byte(msg)); err != nil {
			log.Printf("[Email] SendMail failed: %v", err)
			return
		}
	}
	log.Printf("[Email] Confirmation sent to %s", toEmail)
}

func SendSimpleEmail(smtpHost, smtpPort, smtpUser, smtpPassword, fromName, fromAddr, toEmail, subject, body string) {
	msg := fmt.Sprintf("From: %s <%s>\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		fromName, fromAddr, toEmail, subject, body)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)
	if err := smtp.SendMail(addr, auth, fromAddr, []string{toEmail}, []byte(msg)); err != nil {
		log.Printf("[Email] SendSimpleEmail failed: %v", err)
	}
}
