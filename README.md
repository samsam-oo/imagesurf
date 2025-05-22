# 🌊 ImageSurf

A lightweight, efficient image transformation service built for Cloudflare Workers, designed to resize, convert, and serve images from both local storage and external URLs.

## Features

- **Image Transformation**: Resize images and convert between formats (webp, avif, png, jpeg)
- **Dual Data Sources**: Serve images from both local Cloudflare R2 storage and external URLs
- **Authorization**: JWT-based authentication for upload operations
- **Performance Optimized**: Built for Cloudflare Workers environment

## Usage

### Retrieving Images

To retrieve and transform an image, make a GET request:

```
GET /{path}?width=500&height=300&format=webp
```

#### Parameters:

- **path**: Path to the image (required)
  - For local images: `/your/image/path`
  - For external URLs: `/http/example.com/image.jpg` (note the `/http` prefix)
- **width**: Desired width in pixels (optional)
- **height**: Desired height in pixels (optional)
- **format**: Output format - one of `webp`, `avif`, `png`, `jpeg` (optional)

### Uploading Images

To upload an image, make a POST request:

```
POST /{path}
```

With:

- The image data in the request body
- `Content-Type` header set to the image MIME type
- `Authorization` header set to `Bearer {token}` where token is a JWT

The service automatically converts uploaded images to WebP format for storage efficiency.

#### JWT Requirements:

The JWT token for upload authorization must include:

- `sub` (subject): Must match the exact path where the image will be stored

Example JWT payload:

```json
{
	"sub": "/images/profile/avatar.webp",
	"iat": 1698765432,
	"exp": 1698769032
}
```

You can generate a valid JWT using libraries like `jose` or `jsonwebtoken`, signed with the same secret specified in `JWT_SECRET` environment variable.

## Environment Variables

The following environment variables must be configured:

| Variable       | Description                                           | Default                       |
| -------------- | ----------------------------------------------------- | ----------------------------- |
| `ALLOWED_URLS` | Comma-separated list of allowed external URL prefixes | Required for external URLs    |
| `JWT_SECRET`   | Secret key for JWT verification                       | Optional (no auth if not set) |
| `MAX_WIDTH`    | Maximum allowed width for image resizing              | 10240                         |
| `MAX_HEIGHT`   | Maximum allowed height for image resizing             | 10240                         |

Additionally, you need to bind an R2 bucket named `bucket` to your worker.

## Caching Recommendations

For optimal performance, it's highly recommended to implement caching:

1. **Enable Cloudflare Cache**: Configure appropriate cache settings in your Cloudflare dashboard to cache transformed images at the edge.

2. **Set Cache Headers**: Add cache control headers to define how long images should be cached:

   ```js
   // Example implementation in the worker
   headers: {
     'Content-Type': transformed.contentType,
     'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
   }
   ```

3. **Use Cache API**: For frequently accessed images, consider implementing additional caching using the Cloudflare Workers Cache API.

## Deployment

Deploy this service as a Cloudflare Worker with an R2 bucket binding:

```toml
# Example wrangler.toml configuration
name = "imagesurf"
main = "src/index.ts"

[[r2_buckets]]
binding = "bucket"
bucket_name = "your-image-bucket"

[vars]
ALLOWED_URLS = "https://example.com,https://trusted-source.org"
MAX_WIDTH = "2048"
MAX_HEIGHT = "2048"
# JWT_SECRET should be set through environment variables or encrypted secrets
```

## Security Considerations

- Always set `ALLOWED_URLS` to restrict which external sources can be used
- Use JWT authentication for upload operations
- Consider implementing rate limiting for production use
