package middlewares

import (
	"os"

	"github.com/gin-gonic/gin"
)

func DefaultHeaders() gin.HandlerFunc {
	environment := os.Getenv("ENV")
	return func(c *gin.Context) {
		// Your own default headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		if environment == "production" {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		c.Header("Content-Security-Policy",
			"default-src 'self'; "+
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "+
				"font-src 'self' https://fonts.gstatic.com; "+
				"img-src 'self' data:; "+
				"script-src 'self'; "+
				"connect-src 'self';")
		// my custom header
		c.Header("X-App-Version", "v1")
		c.Next()
	}
}
