package com.eju.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String photosLocation = Paths.get("uploads", "photos").toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/photos/**")
                .addResourceLocations(photosLocation);
    }
}
