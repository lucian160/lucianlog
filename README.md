# Lucian Logs

Lucian Logs is a lightweight application monitoring and logging platform for collecting, viewing, searching, and monitoring logs from projects.

It provides authentication, project management, project API keys, dashboard statistics, log search and filtering, email verification, password reset with OTP confirmation, notifications, firewall protection controls, and administrative tools.

The platform is designed to give developers a centralized view of application activity and make it easier to identify errors and investigate issues.

## Features

* User registration and login
* Email verification with OTP
* Resend email verification OTP
* Project creation and management
* Project API key generation and regeneration
* Log submission from projects using project API keys
* Dashboard analytics
* Total log statistics
* Error and warning statistics
* Latest activity monitoring
* Log search and filtering
* Filtering by log level
* Filtering by HTTP status code
* Search by message, endpoint, method, or stack text
* Password reset with OTP verification
* In-app notifications
* Optional email notifications through Resend
* Firewall access protection
* IP approval workflow
* Admin dashboard
* Pending firewall approval management
* Recent error monitoring
* Admin user and role management
* Rate limiting on authentication and administrative routes
* Helmet security headers
* Persistent firewall approval requests
* Audit logging for administrative actions
* Health check endpoint

## Requirements

Before running Lucian Logs, install:

* Node.js 20 or newer
* MongoDB
* npm

Optional:

* Resend account for email verification, password-reset, and notification emails
* Docker for containerized deployment
* PM2 for Node.js process management

Check your Node.js version:

```bash
node -v
```

Check npm:

```bash
npm -v
```

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Move into the project directory:

```bash
cd lucian-logs
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Open `.env` and configure the required values.

## Environment Variables

Example configuration:

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/lucianlogs

JWT_SECRET=replace_with_a_secure_secret

RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev

CORS_ORIGIN=http://localhost:5000

LUCIAN_FIREWALL_ENABLED=false
LUCIAN_ALLOWED_IPS=203.0.113.10,198.51.100.22
LUCIAN_FIREWALL_APPROVAL_TOKEN=developer-approved
LUCIAN_FIREWALL_HEADER=x-lucian-approval
```

### Environment variable reference

| Variable                         | Required | Description                                   |
| -------------------------------- | -------- | --------------------------------------------- |
| `PORT`                           | No       | Port used by the application                  |
| `MONGO_URI`                      | Yes      | MongoDB connection string                     |
| `JWT_SECRET`                     | Yes      | Secret used for authentication tokens         |
| `RESEND_API_KEY`                 | No       | Resend API key for email functionality        |
| `RESEND_FROM_EMAIL`              | No       | Email address used to send application emails |
| `CORS_ORIGIN`                    | No       | Allowed browser origin for cross-origin calls |
| `LUCIAN_FIREWALL_ENABLED`        | No       | Enables or disables the firewall              |
| `LUCIAN_ALLOWED_IPS`             | No       | Comma-separated list of trusted IP addresses  |
| `LUCIAN_FIREWALL_APPROVAL_TOKEN` | No       | Token used by the firewall approval mechanism |
| `LUCIAN_FIREWALL_HEADER`         | No       | HTTP header used for firewall approval        |

Never commit real secrets to Git.

The `.env` file should remain local or be managed securely through the deployment platform.

## Running Locally

Start the application:

```bash
npm start
```

The default local address is:

```text
http://localhost:5000
```

Open the application in your browser.

The health endpoint is available at:

```text
http://localhost:5000/health
```

The health endpoint can be used by monitoring services and deployment platforms to verify that the application is responding.

## User Workflow

### 1. Create an account

Open:

```text
/register.html
```

Enter:

* Name
* Email
* Password

The application creates the account and sends an email verification OTP. When `RESEND_API_KEY` is not configured, the OTP is printed in the server terminal for local development.

After registration, the user is redirected to the email verification page.

### 2. Verify email

Open:

```text
/verify-email.html
```

Enter the verification OTP received by email.

After successful verification, the account can proceed to normal authentication.

### Resend verification OTP

If the user did not receive the verification email or the OTP expires, the user can select:

```text
Resend OTP
```

The application sends a new verification code when the account is eligible.

API endpoints:

```http
POST /api/auth/request-email-verification
POST /api/auth/verify-email
```

Resend requests should be rate-limited to prevent abuse and excessive email requests.

Already verified accounts should not need another verification OTP.

### 3. Log in

Open:

```text
/login.html
```

Enter the registered email and password.

After successful authentication, the user is redirected to the project dashboard.

### 4. Create a project

From the Projects page, create a project.

Each project receives a unique API key.

The API key is used by the application being monitored when submitting logs.

Project API keys should be treated as secrets.

### 5. Send logs

Applications submit logs to:

```http
POST /api/logs
```

The project API key is supplied through the configured API-key header:

```http
x-api-key: YOUR_PROJECT_API_KEY
```

Example:

```javascript
await fetch("/api/logs", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.LUCIAN_LOGS_API_KEY
    },
    body: JSON.stringify({
        level: "error",
        message: "Payment API request failed",
        statusCode: 500
    })
});
```

### 6. Search and filter logs

Open the Logs page.

Logs can be searched or filtered using information such as:

* Message
* Endpoint
* HTTP method
* Stack text
* Log level
* HTTP status code

This allows developers to narrow down large amounts of application activity.

### 7. View dashboard statistics

The dashboard provides application activity and log statistics.

Depending on the available data, developers can view:

* Total logs
* Errors
* Warnings
* Latest activity
* Log statistics
* Log summaries

### 8. Reset password

From the login page, select:

```text
Forgot password?
```

Enter the account email.

The application sends a password-reset OTP. When `RESEND_API_KEY` is not configured, the OTP is printed in the server terminal for local development.

The user then enters:

* Email
* OTP
* New password

The reset workflow verifies the OTP before allowing the password to be changed.

### 9. Notifications

Authenticated users can receive application notifications.

Notifications may be displayed inside the application and can optionally be delivered through email when Resend is configured.

### 10. Firewall protection

Firewall configuration can be viewed through the Settings page.

When firewall protection is enabled, requests can be evaluated against the configured access rules and approved IP addresses.

Administrators can review firewall approval requests through the Admin dashboard.

## API Documentation

The API is divided into authentication, project, log, notification, and administrative functionality.

## Authentication API

### Register

```http
POST /api/auth/register
```

Creates a new user account.

Example:

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure-password"
}
```

### Login

```http
POST /api/auth/login
```

Authenticates a user.

### Current user

```http
GET /api/auth/me
```

Returns information about the authenticated user.

### Firewall status

```http
GET /api/auth/firewall-status
```

Returns the firewall-related status available to the authenticated user.

### Request password reset

```http
POST /api/auth/request-password-reset
```

Requests a password-reset OTP.

### Verify password reset

```http
POST /api/auth/verify-password-reset
```

Verifies the password-reset OTP.

### Reset password

```http
POST /api/auth/reset-password
```

Sets the new password after successful password-reset verification.

## Email Verification API

The email verification flow includes OTP verification and resend behavior.

### Verify email

```http
POST /api/auth/verify-email
```

The request body contains `email` and `otp`.

### Resend verification OTP

```http
POST /api/auth/request-email-verification
```

The endpoint generates and sends a new verification OTP for eligible unverified accounts.

The endpoint should be rate-limited to prevent abuse.

If Resend is not configured, the OTP is printed to the server terminal instead of being emailed. Configure both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for real email delivery.

## Projects API

### Get projects

```http
GET /api/projects
```

Returns projects belonging to the authenticated user.

### Create project

```http
POST /api/projects
```

Creates a new project and generates its project API key.

### Get project

```http
GET /api/projects/:id
```

Returns information about a specific project.

### Delete project

```http
DELETE /api/projects/:id
```

Deletes a project.

### Activate project

```http
PATCH /api/projects/:id/activate
```

Activates a project.

### Deactivate project

```http
PATCH /api/projects/:id/deactivate
```

Deactivates a project.

### Regenerate API key

```http
POST /api/projects/:id/regenerate-key
```

Generates a new API key for the project.

After regeneration, applications using the old key must be updated with the new credential.

## Logs API

### Submit log

```http
POST /api/logs
```

Accepts a log event from a project.

The project API key is supplied through the configured API-key header.

Example:

```http
x-api-key: YOUR_PROJECT_API_KEY
```

### Get logs

```http
GET /api/logs
```

Returns available logs.

Filtering and pagination should be used when working with large collections.

### Log summary

```http
GET /api/logs/summary
```

Returns summary information about stored logs.

### Log statistics

```http
GET /api/logs/stats
```

Returns statistical information used by the dashboard.

## Notification API

Notifications allow the application to communicate important account and system events to users.

### Get notifications

```http
GET /api/notifications
```

Returns notifications available to the authenticated user.

### Mark notification as read

```http
POST /api/notifications/:id/read
```

Marks a notification as read.

### Send notification

```http
POST /api/admin/notifications/send
```

The administrative notification endpoint can send an in-app notification, an email, or both to a selected user or email address.

When Resend is configured, email notifications are delivered through Resend. Otherwise, the email fallback is printed to the server terminal.

## Admin API

Administrative endpoints require authentication and appropriate administrator privileges.

### Admin summary

```http
GET /api/admin/summary
```

Returns administrative dashboard summary information.

### Firewall approval request

```http
POST /api/admin/firewall/request
```

Creates or submits a firewall approval request.

### Approve firewall request

```http
POST /api/admin/firewall/approve/:id
```

Approves a pending firewall request.

## Admin Dashboard Usage

The Admin dashboard provides administrative tools for managing users, roles, firewall approvals, and monitoring application errors.

### User management

Administrators can:

* View users
* Inspect user accounts
* Change user roles
* Perform authorized administrative actions

### User roles

User access is controlled through role-based authorization.

The application can use roles such as:

```text
user
admin
```

Role changes must be performed through protected server-side administrative routes.

The frontend should never be treated as the security boundary for role management.

### Changing a user role

The general workflow is:

```text
Admin logs in
      ↓
Open Admin dashboard
      ↓
Select user
      ↓
Choose permitted role
      ↓
Server validates admin authorization
      ↓
User role is updated
      ↓
Action is recorded in the audit log
```

Only authorized administrators should be able to change roles.

### Administrative audit logging

Important administrative actions are tracked through the application's audit log model.

Audit records can help identify:

* Who performed an action
* What administrative action occurred
* When the action occurred
* Which account or resource was affected

## Firewall Configuration

Lucian Logs includes an approval-based firewall layer intended to provide a simple access-control mechanism for trusted operators.

Firewall configuration is controlled through environment variables.

Example:

```env
LUCIAN_FIREWALL_ENABLED=true

LUCIAN_ALLOWED_IPS=203.0.113.10,198.51.100.22

LUCIAN_FIREWALL_APPROVAL_TOKEN=developer-approved

LUCIAN_FIREWALL_HEADER=x-lucian-approval
```

Only enable the firewall in environments where its configuration is understood and tested.

## Complete Firewall Approval Workflow

The firewall approval process follows this general flow:

```text
Incoming request
       ↓
Firewall checks request
       ↓
Is request already allowed?
    ↙              ↘
  Yes               No
   ↓                 ↓
Allow request    Create approval request
                     ↓
                Store in MongoDB
                     ↓
                Admin reviews request
                   ↙       ↘
              Approve      Reject
                 ↓            ↓
          Update approval   Keep blocked
                 ↓
          Request allowed
```

### 1. Incoming request

A request reaches the application.

The firewall evaluates the request according to the configured protection rules.

### 2. Allowed request

If the request matches an approved access condition, the request continues normally.

### 3. Approval required

If the request requires authorization, an authenticated user can submit a firewall approval request through:

```http
POST /api/admin/firewall/request
```

The firewall middleware itself does not create database requests automatically; it returns `403` until the request is approved and the required access configuration is supplied.

The request is persisted in MongoDB through the `FirewallRequest` model.

### 4. Pending approval

The request remains pending until an authorized administrator reviews it.

The Admin dashboard provides visibility into pending firewall approvals.

### 5. Administrator review

An administrator reviews the request and determines whether it should be approved.

Administrative authorization must be checked server-side.

### 6. Approve

The administrator can approve the request using:

```http
POST /api/admin/firewall/approve/:id
```

The approval state is updated and the associated access can be permitted according to the application's firewall logic.

### 7. Reject

A request that is not approved remains blocked according to the configured firewall behavior.

### 8. Persistent storage

Firewall approval requests are stored persistently in MongoDB through the `FirewallRequest` model.

This prevents pending requests from depending solely on application memory.

## Firewall Security Notes

The built-in firewall is a basic approval-based protection layer.

It is intended for trusted operators and straightforward access-control scenarios.

For higher-risk production environments, it can be expanded with stronger infrastructure such as:

* Network-level allowlists
* Reverse-proxy access controls
* Cloud firewall rules
* WAF protection
* VPN or private-network access
* Additional authentication requirements

The application firewall should not be considered a replacement for comprehensive network security infrastructure.

## Docker Deployment

Build the Docker image:

```bash
docker build -t lucian-logs .
```

Run the container:

```bash
docker run -p 5000:5000 --env-file .env lucian-logs
```

Check running containers:

```bash
docker ps
```

View container logs:

```bash
docker logs lucian-logs
```

For production, use a secure MongoDB instance and provide production environment variables through your deployment environment.

## PM2 Deployment

Install PM2:

```bash
npm install -g pm2
```

Start the application using the project's ecosystem configuration:

```bash
pm2 start ecosystem.config.js
```

Check the application:

```bash
pm2 status
```

View logs:

```bash
pm2 logs
```

Restart the application:

```bash
pm2 restart ecosystem.config.js
```

Save the PM2 process list:

```bash
pm2 save
```

Configure PM2 to start after system reboot:

```bash
pm2 startup
```

Follow the command provided by PM2.

## Security and Production Checklist

### Environment

* [ ] Set a strong `JWT_SECRET`
* [ ] Never commit `.env`
* [ ] Use production secrets instead of development values
* [ ] Keep API keys private
* [ ] Keep Resend credentials private

### Database

* [ ] Use a real MongoDB instance for staging/production
* [ ] Do not expose MongoDB publicly without appropriate protection
* [ ] Configure authentication
* [ ] Use appropriate indexes
* [ ] Use pagination for large datasets
* [ ] Avoid unbounded database queries

### Authentication

* [ ] Rate-limit authentication routes
* [ ] Validate registration input
* [ ] Validate login input
* [ ] Protect password reset endpoints
* [ ] Add dedicated rate limits for password-reset requests and verification OTP resends
* [ ] Use strong password requirements

### Authorization

* [ ] Protect admin routes
* [ ] Validate roles server-side
* [ ] Do not trust roles supplied by the client
* [ ] Prevent normal users from accessing administrative endpoints
* [ ] Protect firewall approval actions

### API keys

* [ ] Never expose project API keys in frontend source code
* [ ] Regenerate compromised API keys
* [ ] Validate API keys server-side
* [ ] Deactivate projects when necessary

### Firewall

* [ ] Test firewall configuration before enabling it
* [ ] Keep allowed IP addresses accurate
* [ ] Protect firewall approval endpoints
* [ ] Validate approval requests
* [ ] Record important firewall actions
* [ ] Review pending firewall requests

### Email

* [ ] Configure `RESEND_API_KEY`
* [ ] Configure `RESEND_FROM_EMAIL`
* [ ] Use an appropriate verified sender in production
* [ ] Handle email delivery failures
* [ ] Rate-limit OTP requests

### HTTP security

* [ ] Run behind HTTPS
* [ ] Use a reverse proxy such as Nginx or Caddy
* [ ] Keep Helmet security headers enabled
* [ ] Configure `CORS_ORIGIN` appropriately if supported by the application
* [ ] Avoid exposing stack traces in production

### Monitoring

* [ ] Monitor `/health` (the current endpoint reports process health; add a database readiness check if required)
* [ ] Monitor application logs
* [ ] Monitor MongoDB
* [ ] Configure backups
* [ ] Monitor resource usage
* [ ] Keep Node.js and dependencies updated

## Testing

Run the project's test command:

```bash
npm test
```

If the project does not currently define an `npm test` script, add the appropriate test command to `package.json`.

Before production deployment, test the following workflows.

### Authentication tests

* [ ] Registration
* [ ] Duplicate registration
* [ ] Login
* [ ] Invalid login
* [ ] Email verification
* [ ] Resend verification OTP
* [ ] Expired verification OTP
* [ ] Password reset request
* [ ] Password reset OTP verification
* [ ] Password reset
* [ ] Invalid or expired password-reset OTP

### Project tests

* [ ] Create project
* [ ] Retrieve projects
* [ ] Retrieve individual project
* [ ] Delete project
* [ ] Activate project
* [ ] Deactivate project
* [ ] Regenerate API key
* [ ] Prevent unauthorized project access

### Logging tests

* [ ] Submit valid log
* [ ] Reject invalid API key
* [ ] Reject malformed log
* [ ] Retrieve logs
* [ ] Search logs
* [ ] Filter by level
* [ ] Filter by status code
* [ ] Retrieve log summary
* [ ] Retrieve log statistics
* [ ] Test large log collections and pagination

### Notification tests

* [ ] Create notification
* [ ] Retrieve notifications
* [ ] Mark notification as read
* [ ] Send notification through the admin system
* [ ] Send email notification when Resend is configured
* [ ] Handle email delivery failures

### Admin tests

* [ ] Admin authentication
* [ ] Admin-only route protection
* [ ] View admin summary
* [ ] View users
* [ ] Change user role
* [ ] Prevent normal users from changing roles
* [ ] Verify administrative actions are recorded

### Firewall tests

* [ ] Firewall disabled behavior
* [ ] Firewall enabled behavior
* [ ] Allowed IP access
* [ ] Unapproved IP access
* [ ] Authenticated approval request creation
* [ ] Pending approval display
* [ ] Approval action
* [ ] Rejection behavior
* [ ] Unauthorized approval attempt
* [ ] Persistent firewall requests
* [ ] Audit logging

### Health check

Verify:

```http
GET /health
```

returns a successful response when the application and its required services are healthy.

## Operational Notes

* The process health check is available at `/health`; it currently does not verify MongoDB connectivity.
* Authentication and admin routes are rate-limited to reduce abuse.
* Express security headers are enabled with Helmet.
* Admin actions are tracked through the audit log model.
* Firewall approval requests are stored persistently in MongoDB through the `FirewallRequest` model.
* Resend is optional, but email-dependent features require appropriate Resend configuration.
* Project API keys should be treated as sensitive credentials.
* Production deployments should run behind HTTPS.

## Production Deployment

Lucian Logs can be deployed using:

* Docker
* PM2
* Traditional Node.js hosting
* Cloud application platforms

Regardless of the deployment method, production deployments should use secure environment variables, a protected MongoDB instance, HTTPS, appropriate authentication controls, and application monitoring.

## License

Add the project's license information here.

## Author

**Lucian Tech Hub**

Built for developers who want a simpler way to monitor application activity and investigate application issues.
