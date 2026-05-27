package com.eju.auth.student;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/upload")
public class FileUploadController {

    private static final long MAX_DOCUMENT_SIZE = 5 * 1024 * 1024L;
    private static final long MAX_PHOTO_SIZE = 2 * 1024 * 1024L;
    private static final double PHOTO_ASPECT_RATIO = 4.0 / 3.0;
    private static final double PHOTO_ASPECT_TOLERANCE = 0.03;

    @PostMapping("/photo")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file,
                                         Authentication auth) throws IOException {
        return uploadByType("photo", file, auth);
    }

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("type") String type,
                                    @RequestParam("file") MultipartFile file,
                                    Authentication auth) throws IOException {
        return uploadByType(type, file, auth);
    }

    private ResponseEntity<?> uploadByType(String type, MultipartFile file, Authentication auth) throws IOException {
        UUID userId = (UUID) auth.getPrincipal();
        String normalizedType = type == null ? "" : type.trim().toLowerCase();

        long maxSize = "passport".equals(normalizedType) ? MAX_DOCUMENT_SIZE : MAX_PHOTO_SIZE;
        if (file.getSize() > maxSize) {
            String message = "photo".equals(normalizedType)
                    ? "Цээж зургийн хэмжээ 2MB-аас бага байх ёстой."
                    : "Файлын хэмжээ хэтэрсэн байна.";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }

        if ("photo".equals(normalizedType) || "passport".equals(normalizedType)) {
            String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
            if ("photo".equals(normalizedType)) {
                String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
                if (!isAllowedPhotoType(contentType, originalName)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Цээж зураг JPG эсвэл PNG байх ёстой."));
                }
                BufferedImage image = ImageIO.read(file.getInputStream());
                if (image == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Цээж зураг уншигдсангүй."));
                }
                double ratio = (double) image.getWidth() / Math.max(1, image.getHeight());
                if (Math.abs(ratio - PHOTO_ASPECT_RATIO) > PHOTO_ASPECT_TOLERANCE) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Цээж зураг 4x3 харьцаатай байх ёстой."));
                }
            }
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Файл оруулах төрөл буруу байна."));
        }

        String dir = "passport".equals(normalizedType) ? "documents" : "photos";
        Path folder = Paths.get("uploads", dir, userId.toString());
        Files.createDirectories(folder);

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0) ext = originalName.substring(dot);

        String filename = normalizedType + "-" + System.currentTimeMillis() + ext;
        Path dest = folder.resolve(filename);
        file.transferTo(dest);

        String path = dir + "/" + userId + "/" + filename;
        return ResponseEntity.ok(Map.of("path", path));
    }

    private boolean isAllowedPhotoType(String contentType, String originalName) {
        String lowerName = originalName.toLowerCase(Locale.ROOT);
        boolean contentTypeAllowed = "image/jpeg".equals(contentType) || "image/png".equals(contentType);
        boolean extensionAllowed = lowerName.endsWith(".jpg")
                || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png");
        return contentTypeAllowed && extensionAllowed;
    }
}
