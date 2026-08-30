## Purpose

Agrega headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) a todas las respuestas HTTP para mitigar XSS, clickjacking, MIME sniffing y otros ataques del lado cliente.

## ADDED Requirements

### Requirement: Content Security Policy (CSP)
El sistema DEBE enviar header `Content-Security-Policy` en todas las respuestas HTML/API con una política restrictiva que permita solo fuentes propias (`'self'`) para scripts, styles, fonts, images, connect-src (API backend y AI), y frame-ancestors `'none'`.

#### Scenario: CSP en respuesta HTML
- **WHEN** el frontend solicita la página principal `/`
- **THEN** la respuesta incluye header `Content-Security-Policy` con `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self' http://localhost:3001 http://localhost:3002; frame-ancestors 'none'`

### Requirement: HTTP Strict Transport Security (HSTS)
El sistema DEBE enviar header `Strict-Transport-Security` con `max-age=31536000; includeSubDomains; preload` en todas las respuestas HTTPS para forzar HTTPS en navegadores.

#### Scenario: HSTS en producción
- **WHEN** el backend sirve tráfico HTTPS en producción
- **THEN** todas las respuestas incluyen `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### Requirement: X-Frame-Options
El sistema DEBE enviar `X-Frame-Options: DENY` en todas las respuestas para prevenir clickjacking.

#### Scenario: Prevención de clickjacking
- **WHEN** un sitio malicioso intenta iframear la aplicación
- **THEN** el navegador bloquea el frame por `X-Frame-Options: DENY`

### Requirement: X-Content-Type-Options
El sistema DEBE enviar `X-Content-Type-Options: nosniff` para prevenir MIME type sniffing.

#### Scenario: Prevención de MIME sniffing
- **WHEN** un atacante sirve archivo con Content-Type incorrecto
- **THEN** el navegador respeta el Content-Type declarado por `X-Content-Type-Options: nosniff`

### Requirement: Referrer-Policy
El sistema DEBE enviar `Referrer-Policy: strict-origin-when-cross-origin` para controlar información de referrer.

#### Scenario: Control de referrer
- **WHEN** el usuario navega desde la app a un sitio externo
- **THEN** el referrer enviado es solo el origen (no path ni query) por `Referrer-Policy: strict-origin-when-cross-origin`

### Requirement: Permissions-Policy
El sistema DEBE enviar `Permissions-Policy` restringiendo APIs sensibles: `geolocation=(), microphone=(), camera=(), payment=(), usb=()`.

#### Scenario: Restricción de APIs del navegador
- **WHEN** la aplicación carga en el navegador
- **THEN** header `Permissions-Policy` deshabilita geolocation, microphone, camera, payment, usb