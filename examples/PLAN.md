# PLAN: API Gateway Bootstrap (Go)

Bootstrap a minimal Go API gateway under `services/api-gateway`, as described in [ARCHITECTURE.md](./ARCHITECTURE.md). Scope is **basic setup only**: Go module, HTTP framework, health endpoint, and configurable port. Actual proxy routing to learning-service / analytics-service / notes-service comes later.

## Progress Tracker

| Ticket | Description                                   | Status  |
| ------ | --------------------------------------------- | ------- |
| T-001  | Make the Go toolchain available on PATH       | ✅ DONE |
| T-002  | Create api-gateway folder and Go module       | ✅ DONE |
| T-003  | Choose and configure HTTP framework           | ✅ DONE |
| T-004  | Implement health and hello endpoints          | ✅ DONE |
| T-005  | Configurable port and downstream service URLs | ✅ DONE |
| T-006  | Verify gateway runs and responds              | 🔲 TODO |
| T-007  | Add service README                            | 🔲 TODO |

## Tasks

#### T-001: Make the Go toolchain available on PATH

**Description:**  
Go 1.27.1 is already installed at `/usr/local/go`, but `go` is not on PATH. The installer registered `/usr/local/go/bin` in `/etc/paths.d/go`, and `~/.zprofile` then overwrites PATH with an absolute assignment that discards everything `path_helper` contributed. Fix that line so inherited entries survive (`/opt/podman/bin` is dropped by the same bug).

**Acceptance Criteria:**

- [x] Go 1.22 or newer installed (1.27.1 at `/usr/local/go`)
- [x] `go env GOPATH` resolves (`/Users/johndoe/go`)
- [x] `~/.zprofile` no longer clobbers the inherited PATH
- [x] `go version` works in a fresh shell without a full path

---

#### T-002: Create api-gateway folder and Go module

**Description:**  
Create `services/api-gateway` and initialize a Go module. Follow the existing folder naming used by `services/learning-service` (no language suffix), with `cmd/gateway/main.go` as the entry point and `internal/` reserved for future routing and config packages. Add a `.gitignore` for build artifacts.

**Acceptance Criteria:**

- [x] `services/api-gateway` folder exists
- [x] `go.mod` created with module path `github.com/studyflow/api-gateway`
- [x] `cmd/gateway/main.go` entry point exists
- [x] `.gitignore` excludes compiled binaries
- [x] `go build ./...` succeeds

**Files affected:**

`services/api-gateway/go.mod` — 🟢 NEW

```go
module github.com/studyflow/api-gateway

go 1.27.1
```

`services/api-gateway/.gitignore` — 🟢 NEW

```sh
bin
/gateway
*.exe
*.test
*.out
```

---

#### T-003: Choose and configure HTTP framework

**Description:**  
ARCHITECTURE.md lists two options: **Fiber** (fasthttp-based, very fast, Express-like API) or **Gin** (net/http-based, largest ecosystem, middleware-rich). **Gin** is recommended for a gateway: it sits on standard `net/http`, so `httputil.ReverseProxy` and standard middleware work directly when real routing is added. Add the dependency and wire up a basic router and server.

**Acceptance Criteria:**

- [x] Framework dependency added to `go.mod` and `go.sum`
- [x] Router instance created in `main.go`
- [x] HTTP server starts and listens without errors
- [x] Unit test exercises the router in-process via `httptest` (`internal/router/router_test.go`)

**Files affected:**

`services/api-gateway/go.mod` — 🟡 MODIFIED

```diff
 module github.com/studyflow/api-gateway

 go 1.27.1
+
+require github.com/gin-gonic/gin v1.12.0
```

`services/api-gateway/cmd/gateway/main.go` — 🟢 NEW

```go
package main

import (
	"log"
	"net/http"

	"github.com/studyflow/api-gateway/internal/router"
)

func main() {
	server := &http.Server{
		Addr:    ":8000",
		Handler: router.New(),
	}

	log.Printf("api-gateway listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("api-gateway failed: %v", err)
	}
}
```

---

#### T-004: Implement health and hello endpoints

**Description:**  
Add two minimal endpoints: `GET /health` returning `{"status": "ok"}` for future Docker/Kubernetes probes, and `GET /hello` returning `{"message": "Hello from api-gateway"}` to mirror the learning-service bootstrap.

**Acceptance Criteria:**

- [x] `GET /health` returns 200 with JSON status body
- [x] `GET /hello` returns 200 with JSON message body
- [x] Responses use `application/json` content type
- [x] Unknown routes return 404
- [x] Unit tests cover status code, content type, and body for `/health`, `/hello`, and an unknown route

**Files affected:**

`services/api-gateway/internal/router/router.go` — 🟢 NEW

```go
package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func New() *gin.Engine {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello from api-gateway"})
	})

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
	})

	return r
}
```

`services/api-gateway/internal/router/router_test.go` — 🟢 NEW

```go
func TestRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := New()

	tests := []struct {
		path       string
		wantStatus int
		wantKey    string
		wantValue  string
	}{
		{"/health", http.StatusOK, "status", "ok"},
		{"/hello", http.StatusOK, "message", "Hello from api-gateway"},
		{"/unknown", http.StatusNotFound, "error", "not found"},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			r.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", w.Code, tt.wantStatus)
			}
			if ct := w.Header().Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
				t.Fatalf("content type = %q, want application/json", ct)
			}
			// ...decode JSON body and compare tt.wantKey / tt.wantValue
		})
	}
}
```

---

#### T-005: Configurable port and downstream service URLs

**Description:**  
Read configuration from environment variables with sensible defaults, so the gateway can later be pointed at services running in Docker or Kubernetes. Keep it dependency-free using `os.Getenv`. No proxying yet — just load and log the values at startup.

**Acceptance Criteria:**

- [x] `PORT` env var controls the listen port, default `8000`
- [x] `LEARNING_SERVICE_URL` default `http://localhost:8080`
- [x] `ANALYTICS_SERVICE_URL` and `NOTES_SERVICE_URL` placeholders defined
- [x] Resolved config logged once on startup
- [x] Unit tests cover defaults and env var overrides (`internal/config/config_test.go`)

**Files affected:**

`services/api-gateway/internal/config/config.go` — 🟢 NEW

```go
package config

import "os"

type Config struct {
	Port                string
	LearningServiceURL  string
	AnalyticsServiceURL string
	NotesServiceURL     string
}

func Load() Config {
	return Config{
		Port:                getEnv("PORT", "8000"),
		LearningServiceURL:  getEnv("LEARNING_SERVICE_URL", "http://localhost:8080"),
		AnalyticsServiceURL: getEnv("ANALYTICS_SERVICE_URL", "http://localhost:8081"),
		NotesServiceURL:     getEnv("NOTES_SERVICE_URL", "http://localhost:8082"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

`services/api-gateway/internal/config/config_test.go` — 🟢 NEW

```go
func TestLoadFromEnv(t *testing.T) {
	t.Setenv("PORT", "9000")
	t.Setenv("LEARNING_SERVICE_URL", "http://learning:8080")
	t.Setenv("ANALYTICS_SERVICE_URL", "http://analytics:8081")
	t.Setenv("NOTES_SERVICE_URL", "http://notes:8082")

	want := Config{
		Port:                "9000",
		LearningServiceURL:  "http://learning:8080",
		AnalyticsServiceURL: "http://analytics:8081",
		NotesServiceURL:     "http://notes:8082",
	}
	if got := Load(); got != want {
		t.Fatalf("Load() = %+v, want %+v", got, want)
	}
}
```

`services/api-gateway/cmd/gateway/main.go` — 🟡 MODIFIED

```diff
 import (
 	"log"
 	"net/http"

+	"github.com/studyflow/api-gateway/internal/config"
 	"github.com/studyflow/api-gateway/internal/router"
 )

 func main() {
+	cfg := config.Load()
+
+	log.Printf("config: port=%s learning=%s analytics=%s notes=%s",
+		cfg.Port, cfg.LearningServiceURL, cfg.AnalyticsServiceURL, cfg.NotesServiceURL)
+
 	server := &http.Server{
-		Addr:    ":8000",
+		Addr:    ":" + cfg.Port,
 		Handler: router.New(),
 	}
```

---

#### T-006: Verify gateway runs and responds

**Description:**  
Confirm the gateway builds, starts locally, and both endpoints are reachable.

**Acceptance Criteria:**

- [ ] `go run ./cmd/gateway` starts the service
- [ ] `curl http://localhost:8000/health` returns the expected JSON
- [ ] `curl http://localhost:8000/hello` returns the expected JSON
- [ ] No runtime errors on startup, request handling, or shutdown
- [ ] `go test ./...` passes

---

#### T-007: Add service README

**Description:**  
Document how to build, run, and test the gateway, matching the style of `services/learning-service/README.md`. Include the environment variables from T-005.

**Acceptance Criteria:**

- [ ] `services/api-gateway/README.md` exists
- [ ] Build, run, and test (`go test ./...`) commands documented
- [ ] Environment variables and defaults documented
- [ ] Example `curl` commands included

**Files affected:**

`services/api-gateway/README.md` — 🟡 MODIFIED

```diff
 go build ./cmd/gateway
+
+# Test the API Gateway
+
+Run from `services/api-gateway`: `go test ./...`
+
+# Configuration
+
+| Variable                | Default                 |
+| ----------------------- | ----------------------- |
+| `PORT`                  | `8000`                  |
+| `LEARNING_SERVICE_URL`  | `http://localhost:8080` |
+| `ANALYTICS_SERVICE_URL` | `http://localhost:8081` |
+| `NOTES_SERVICE_URL`     | `http://localhost:8082` |
+
+# Try it
+
+`curl http://localhost:8000/health` returns `{"status":"ok"}`
+
+`curl http://localhost:8000/hello` returns `{"message":"Hello from api-gateway"}`
```

---

## Notes

- Scope is basic setup only; reverse-proxy routes (`/items`, `/chapters`, `/analytics/*`, `/notes/*`) are a follow-up feature
- `learning-service` already occupies port `8080`, so the gateway defaults to `8000` locally
- ARCHITECTURE.md's repo structure suggests `api-gateway-go`, but the existing tree uses unsuffixed names (`services/learning-service`), so `services/api-gateway` keeps it consistent
- Gin is recommended over Fiber because it uses standard `net/http`, which makes `httputil.ReverseProxy` straightforward later
- Auth, rate limiting, and BFF-style response aggregation are explicitly future work per ARCHITECTURE.md
- Every task that adds or changes Go code must include unit tests; toolchain, scaffolding, and documentation tasks are exempt
