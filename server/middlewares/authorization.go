package middlewares

import "github.com/gin-gonic/gin"

func AuthzMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Authorization logic goes here
		c.Next()
	}
}
