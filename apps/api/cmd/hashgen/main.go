package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	passwords := []string{"Admin@2026", "User@2026"}
	for _, pwd := range passwords {
		hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Error hashing %s: %v", pwd, err)
		}
		fmt.Printf("%s: %s\n", pwd, string(hash))
	}
}
