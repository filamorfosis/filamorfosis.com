# Product Reviews System - Deployment Checklist

## Pre-Deployment Verification

### ✅ Backend Components
- [x] **Database Migration Applied**
  - File: `20260504165320_AddProductReviews.cs`
  - Table: `ProductReviews` created
  - Indexes: ProductId, Status, ProductVariantId, UserId
  - Foreign keys configured with proper cascade rules

- [x] **Domain Entities**
  - File: `backend/Filamorfosis.Domain/Entities/ProductReview.cs`
  - Entity: `ProductReview` with all properties
  - Enum: `ReviewStatus` (Pending, Approved, Rejected)
  - Navigation properties configured

- [x] **DTOs**
  - File: `backend/Filamorfosis.Application/DTOs/ReviewDtos.cs`
  - `ReviewDto` - complete review data
  - `SubmitReviewRequest` - submission payload
  - `ReviewDecisionRequest` - approval/rejection payload

- [x] **Controllers**
  - File: `backend/Filamorfosis.API/Controllers/ReviewsController.cs`
    - GET approved reviews (public)
    - POST submit review (public)
    - POST upload image (public)
  - File: `backend/Filamorfosis.API/Controllers/AdminReviewsController.cs`
    - GET all reviews with filters (admin)
    - GET single review (admin)
    - PUT approve/reject (admin)
    - DELETE review (admin)
    - DELETE image (admin)

- [x] **Database Context**
  - File: `backend/Filamorfosis.Infrastructure/Data/FilamorfosisDbContext.cs`
  - DbSet: `ProductReviews` configured
  - JSON serialization for ImageUrls array
  - Relationships and indexes configured

- [x] **Build Status**
  - ✅ Backend builds successfully
  - ✅ No compilation errors
  - ✅ No diagnostics warnings

### ✅ Frontend Components
- [x] **Admin Panel HTML**
  - File: `admin.html`
  - Reviews tab added to navigation
  - Reviews panel with table and filters
  - Review detail modal structure

- [x] **JavaScript Modules**
  - File: `assets/js/admin-reviews.js` (16,607 bytes)
    - loadReviews() function
    - renderReviewsTable() function
    - openReviewModal() function
    - Approval/rejection handlers
    - Image deletion handlers
    - Event listeners wired

- [x] **API Client**
  - File: `assets/js/admin-api.js`
  - adminGetReviews() method
  - adminGetReview() method
  - adminDecideReview() method
  - adminDeleteReview() method
  - adminDeleteReviewImage() method

- [x] **Initialization**
  - Reviews module loaded in admin.html
  - Tab permissions configured
  - Lazy loading on first tab visit
  - Event listeners for filters and search

### ✅ Documentation
- [x] **Implementation Summary**
  - File: `REVIEWS_IMPLEMENTATION_SUMMARY.md`
  - Complete technical documentation
  - API endpoints documented
  - Database schema documented
  - Future enhancements listed

- [x] **Admin Guide**
  - File: `REVIEWS_ADMIN_GUIDE.md`
  - Step-by-step instructions
  - Workflow recommendations
  - Troubleshooting guide
  - Best practices

- [x] **Quick Reference**
  - File: `REVIEWS_QUICK_REFERENCE.md`
  - Quick access information
  - Action buttons reference
  - Approval criteria
  - Common issues solutions

---

## Deployment Steps

### 1. Database Migration
```bash
cd backend/Filamorfosis.API
dotnet ef database update
```

**Verify:**
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='ProductReviews';
```

Expected: Table exists with all columns

### 2. Backend Deployment

#### Build and Test
```bash
cd backend
dotnet build
dotnet test
```

Expected: All tests pass

#### Deploy to AWS
```bash
# Using AWS Elastic Beanstalk CLI
cd backend/Filamorfosis.API
eb deploy production
```

**Or using Docker:**
```bash
docker build -t filamorfosis-api:latest .
docker push <your-registry>/filamorfosis-api:latest
```

### 3. Frontend Deployment

#### Verify Files
```bash
# Check all required files exist
ls -la admin.html
ls -la assets/js/admin-reviews.js
ls -la assets/js/admin-api.js
```

#### Deploy to S3/CloudFront
```bash
# Sync to S3
aws s3 sync . s3://filamorfosis-frontend/ \
  --exclude ".git/*" \
  --exclude "backend/*" \
  --exclude "node_modules/*"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <YOUR_DISTRIBUTION_ID> \
  --paths "/admin.html" "/assets/js/*"
```

### 4. S3 Bucket Configuration

#### Create Reviews Folder
```bash
aws s3api put-object \
  --bucket filamorfosis-uploads \
  --key reviews/
```

#### Set Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowReviewImageUploads",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<ACCOUNT_ID>:role/FilamorfosisAPIRole"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::filamorfosis-uploads/reviews/*"
    }
  ]
}
```

#### Configure CORS
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://filamorfosis.com", "https://www.filamorfosis.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 5. CloudFront Configuration

#### Add Cache Behavior for Review Images
```
Path Pattern: reviews/*
Origin: S3 Bucket (filamorfosis-uploads)
Viewer Protocol Policy: Redirect HTTP to HTTPS
Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, DELETE
Cache Policy: CachingOptimized
Origin Request Policy: CORS-S3Origin
```

### 6. Environment Variables

#### Backend (.NET)
```bash
# AWS Secrets Manager or appsettings.json
{
  "AWS": {
    "S3": {
      "BucketName": "filamorfosis-uploads",
      "Region": "us-east-1"
    }
  },
  "CloudFront": {
    "BaseUrl": "https://cdn.filamorfosis.com"
  }
}
```

#### Frontend (JavaScript)
```javascript
// Already configured in admin.html
window.FILAMORFOSIS_API_BASE = 'https://api.filamorfosis.com/api/v1';
window.FILAMORFOSIS_CDN_BASE = 'https://cdn.filamorfosis.com';
```

---

## Post-Deployment Testing

### 1. Backend API Tests

#### Test Public Endpoints
```bash
# Get approved reviews for a product
curl -X GET "https://api.filamorfosis.com/api/v1/products/{productId}/reviews?page=1&pageSize=20"

# Submit a review (should return 201)
curl -X POST "https://api.filamorfosis.com/api/v1/products/{productId}/reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "authorName": "Test User",
    "rating": 5,
    "body": "Great product!"
  }'
```

#### Test Admin Endpoints (requires auth)
```bash
# Get all reviews (requires JWT token)
curl -X GET "https://api.filamorfosis.com/api/v1/admin/reviews?status=Pending" \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Approve a review
curl -X PUT "https://api.filamorfosis.com/api/v1/admin/reviews/{reviewId}/decision" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "Approved",
    "adminNote": "Looks good"
  }'
```

### 2. Frontend UI Tests

#### Admin Panel Access
- [ ] Navigate to `https://filamorfosis.com/admin.html`
- [ ] Log in with admin credentials
- [ ] Complete MFA verification
- [ ] Verify "Reseñas" tab is visible
- [ ] Click on "Reseñas" tab
- [ ] Verify reviews table loads

#### Filtering and Search
- [ ] Select "Pendiente" from status filter
- [ ] Verify only pending reviews show
- [ ] Type in search box
- [ ] Verify search results update automatically
- [ ] Clear search
- [ ] Verify all reviews return

#### Review Actions
- [ ] Click "Ver detalle" (eye icon)
- [ ] Verify modal opens with full review
- [ ] Verify images display correctly
- [ ] Click "Aprobar" on a pending review
- [ ] Verify success toast appears
- [ ] Verify review status changes to "Aprobada"
- [ ] Click "Rechazar" on a pending review
- [ ] Enter rejection reason
- [ ] Verify review status changes to "Rechazada"

#### Image Management
- [ ] Open a review with images
- [ ] Click ✗ on an image
- [ ] Confirm deletion
- [ ] Verify image is removed
- [ ] Verify image is deleted from S3

### 3. Integration Tests

#### End-to-End Review Submission
1. [ ] Go to a product page (as customer)
2. [ ] Submit a review with text and image
3. [ ] Verify review appears as "Pending" in admin
4. [ ] Approve the review in admin panel
5. [ ] Verify review appears on product page
6. [ ] Verify average rating updates

#### Image Upload Flow
1. [ ] Submit review with 3 images
2. [ ] Verify all images upload successfully
3. [ ] Verify images are accessible via CDN
4. [ ] Delete one image from admin
5. [ ] Verify image is removed from S3
6. [ ] Verify other images remain

#### Authorization Tests
1. [ ] Log in as user without review permissions
2. [ ] Verify "Reseñas" tab is hidden
3. [ ] Try to access `/api/v1/admin/reviews` directly
4. [ ] Verify 403 Forbidden response

---

## Monitoring and Alerts

### CloudWatch Metrics to Monitor
- [ ] API request count for `/admin/reviews/*`
- [ ] API error rate for review endpoints
- [ ] S3 upload success/failure rate for `reviews/` prefix
- [ ] Average response time for review queries

### CloudWatch Alarms to Create
```bash
# High error rate on review endpoints
aws cloudwatch put-metric-alarm \
  --alarm-name ReviewsAPIHighErrorRate \
  --alarm-description "Alert when review API error rate exceeds 5%" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# S3 upload failures
aws cloudwatch put-metric-alarm \
  --alarm-name ReviewImageUploadFailures \
  --alarm-description "Alert on review image upload failures" \
  --metric-name 4xxErrors \
  --namespace AWS/S3 \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Application Logs to Monitor
- Review submission attempts
- Image upload successes/failures
- Admin approval/rejection actions
- S3 deletion operations

---

## Rollback Plan

### If Issues Occur

#### Backend Issues
```bash
# Rollback to previous version
eb deploy production --version <previous-version>

# Or rollback database migration
cd backend/Filamorfosis.API
dotnet ef migrations remove
dotnet ef database update <previous-migration>
```

#### Frontend Issues
```bash
# Restore previous version from S3
aws s3 sync s3://filamorfosis-frontend-backup/ s3://filamorfosis-frontend/

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id <YOUR_DISTRIBUTION_ID> \
  --paths "/*"
```

#### Database Issues
```sql
-- Disable reviews feature temporarily
UPDATE ProductReviews SET Status = 'Pending' WHERE Status = 'Approved';

-- Or drop table if critical
DROP TABLE ProductReviews;
```

---

## Success Criteria

### Functional Requirements
- [x] Customers can submit reviews with images
- [x] Reviews require admin approval before display
- [x] Admins can approve/reject reviews with notes
- [x] Admins can delete reviews and images
- [x] Only approved reviews show on product pages
- [x] Average rating calculated from approved reviews

### Performance Requirements
- [ ] Review list loads in < 2 seconds
- [ ] Image upload completes in < 5 seconds
- [ ] Approval action completes in < 1 second
- [ ] Search results update in < 500ms

### Security Requirements
- [x] Admin endpoints require authentication
- [x] Admin endpoints require MFA
- [x] Role-based access control enforced
- [x] Image uploads validated (type, size)
- [x] SQL injection protection (EF Core)
- [x] XSS protection (input sanitization)

---

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs for first 24 hours
- [ ] Test all workflows manually
- [ ] Verify S3 uploads working correctly
- [ ] Check CloudFront cache behavior
- [ ] Verify email notifications (if implemented)

### Short-term (Week 1)
- [ ] Review CloudWatch metrics
- [ ] Analyze review submission patterns
- [ ] Check for spam or abuse
- [ ] Gather admin feedback on UI
- [ ] Document any issues encountered

### Long-term (Month 1)
- [ ] Analyze review approval rates
- [ ] Review storage costs (S3)
- [ ] Optimize database queries if needed
- [ ] Plan feature enhancements
- [ ] Update documentation based on feedback

---

## Support Contacts

### Technical Issues
- **Backend:** backend-team@filamorfosis.com
- **Frontend:** frontend-team@filamorfosis.com
- **DevOps:** devops@filamorfosis.com

### Business Issues
- **Product Manager:** pm@filamorfosis.com
- **Customer Support:** soporte@filamorfosis.com

---

## Additional Resources

- **Implementation Summary:** `REVIEWS_IMPLEMENTATION_SUMMARY.md`
- **Admin Guide:** `REVIEWS_ADMIN_GUIDE.md`
- **Quick Reference:** `REVIEWS_QUICK_REFERENCE.md`
- **API Documentation:** Swagger UI at `/swagger`
- **AWS Console:** https://console.aws.amazon.com

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Sign-off:** _____________

---

## Notes

_Use this space to document any deployment-specific notes, issues encountered, or deviations from the plan:_

```
[Add notes here]
```
