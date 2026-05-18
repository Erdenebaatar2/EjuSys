package com.eju.auth.student;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/upload")
public class FileUploadController {

    private static final long MAX_DOCUMENT_SIZE = 5 * 1024 * 1024L;
    private static final long MAX_PHOTO_SIZE = 2 * 1024 * 1024L;

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
            return ResponseEntity.badRequest().body(Map.of("message", "File too large"));
        }

        if ("photo".equals(normalizedType) || "passport".equals(normalizedType)) {
            String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
            if ("photo".equals(normalizedType) && !("image/jpeg".equals(contentType) || "image/png".equals(contentType))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Photo must be JPG or PNG"));
            }
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid upload type"));
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
}
