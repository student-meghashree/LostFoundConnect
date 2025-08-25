# Java Backend Integration Guide

## Overview
This document provides the API endpoints and Java code structure needed to integrate with the Lost and Found frontend.

## Technology Stack Recommendations
- **Framework**: Spring Boot 3.x
- **Database**: MySQL 8.x
- **ORM**: Spring Data JPA / Hibernate
- **File Upload**: Spring Web MultipartFile
- **Security**: Spring Security (optional)

## Required Dependencies (pom.xml)
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
</dependencies>
```

## API Endpoints Required

### 1. Get All Items
```
GET /api/items
Response: Array of Item objects
```

### 2. Create New Item
```
POST /api/items
Body: Item JSON object
Response: Created Item object
```

### 3. Upload Image
```
POST /api/upload
Body: MultipartFile
Response: { "imageUrl": "path/to/image" }
```

### 4. Get Item by ID
```
GET /api/items/{id}
Response: Item object
```

### 5. Update Item Status
```
PUT /api/items/{id}/status
Body: { "status": "resolved" }
Response: Updated Item object
```

## Java Entity Classes

### Item.java
```java
@Entity
@Table(name = "items")
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType type;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false)
    private String location;
    
    @Column(name = "date_reported")
    private LocalDateTime dateReported;
    
    @Column(name = "contact_name", nullable = false)
    private String contactName;
    
    @Column(name = "contact_email", nullable = false)
    private String contactEmail;
    
    @Column(name = "contact_phone")
    private String contactPhone;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Enumerated(EnumType.STRING)
    private ItemStatus status = ItemStatus.ACTIVE;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors, getters, setters...
}

enum ItemType {
    LOST, FOUND
}

enum ItemStatus {
    ACTIVE, RESOLVED
}
```

## Sample Controller Class

### ItemController.java
```java
@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*") // Configure properly in production
public class ItemController {
    
    @Autowired
    private ItemService itemService;
    
    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        List<Item> items = itemService.findAllActive();
        return ResponseEntity.ok(items);
    }
    
    @PostMapping
    public ResponseEntity<Item> createItem(@Valid @RequestBody ItemCreateRequest request) {
        Item item = itemService.createItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItem(@PathVariable Long id) {
        return itemService.findById(id)
            .map(item -> ResponseEntity.ok(item))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Item> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return itemService.updateStatus(id, request.getStatus())
            .map(item -> ResponseEntity.ok(item))
            .orElse(ResponseEntity.notFound().build());
    }
}
```

### FileUploadController.java
```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FileUploadController {
    
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("image") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Create uploads directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = UUID.randomUUID().toString() + extension;
            
            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            // Return file URL
            String imageUrl = "/uploads/" + filename;
            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

## Application Properties

### application.properties
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/lost_found_db
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
app.upload.dir=uploads

# Server Configuration
server.port=8080

# CORS Configuration (for development)
spring.web.cors.allowed-origins=http://localhost:3000,http://127.0.0.1:5500
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
```

## Service Layer Example

### ItemService.java
```java
@Service
@Transactional
public class ItemService {
    
    @Autowired
    private ItemRepository itemRepository;
    
    public List<Item> findAllActive() {
        return itemRepository.findByStatusOrderByDateReportedDesc(ItemStatus.ACTIVE);
    }
    
    public Optional<Item> findById(Long id) {
        return itemRepository.findById(id);
    }
    
    public Item createItem(ItemCreateRequest request) {
        Item item = new Item();
        item.setType(request.getType());
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setCategory(request.getCategory());
        item.setLocation(request.getLocation());
        item.setContactName(request.getContactName());
        item.setContactEmail(request.getContactEmail());
        item.setContactPhone(request.getContactPhone());
        item.setImageUrl(request.getImageUrl());
        item.setDateReported(LocalDateTime.now());
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        
        return itemRepository.save(item);
    }
    
    public Optional<Item> updateStatus(Long id, ItemStatus status) {
        return itemRepository.findById(id)
            .map(item -> {
                item.setStatus(status);
                item.setUpdatedAt(LocalDateTime.now());
                return itemRepository.save(item);
            });
    }
}
```

## Frontend Integration Points

1. **Update API_CONFIG in script.js**:
   ```javascript
   const API_CONFIG = {
       BASE_URL: 'http://localhost:8080/api',
       ENDPOINTS: {
           ITEMS: '/items',
           UPLOAD: '/upload',
           CONTACT: '/contact'
       }
   };
   ```

2. **Enable CORS** in your Spring Boot application for frontend domain

3. **Configure file serving** for uploaded images:
   ```java
   @Configuration
   public class WebConfig implements WebMvcConfigurer {
       @Override
       public void addResourceHandlers(ResourceHandlerRegistry registry) {
           registry.addResourceHandler("/uploads/**")
                   .addResourceLocations("file:uploads/");
       }
   }
   ```

## Testing the Integration

1. Start your Java backend server
2. Open the HTML frontend in a browser
3. Test creating items and uploading images
4. Verify data is stored in MySQL database

## Next Steps

1. Implement proper error handling
2. Add input validation
3. Implement authentication/authorization
4. Add email notification functionality
5. Implement search indexing for better performance
6. Add unit and integration tests