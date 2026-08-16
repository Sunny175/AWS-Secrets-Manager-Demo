package com.sunny.AWS_Secrets_Manager_Demo.controller;

import com.sunny.AWS_Secrets_Manager_Demo.dto.MovieDetails;
import com.sunny.AWS_Secrets_Manager_Demo.dto.MovieSearchResult;
import com.sunny.AWS_Secrets_Manager_Demo.service.WatchmodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "*")
public class MovieController {

    private final WatchmodeService watchmodeService;

    public MovieController(WatchmodeService watchmodeService) {
        this.watchmodeService = watchmodeService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<MovieSearchResult>> searchMovies(
            @RequestParam("q") String query,
            @RequestHeader(value = "X-Watchmode-Api-Key", required = false) String customApiKey) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(watchmodeService.getPopularMovies(customApiKey));
        }
        return ResponseEntity.ok(watchmodeService.searchMovies(query, customApiKey));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieDetails> getMovieDetails(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Watchmode-Api-Key", required = false) String customApiKey) {
        return ResponseEntity.ok(watchmodeService.getMovieDetails(id, customApiKey));
    }

    @GetMapping("/popular")
    public ResponseEntity<List<MovieSearchResult>> getPopularMovies(
            @RequestHeader(value = "X-Watchmode-Api-Key", required = false) String customApiKey) {
        return ResponseEntity.ok(watchmodeService.getPopularMovies(customApiKey));
    }

    @PostMapping("/cache/clear")
    public ResponseEntity<Map<String, Object>> clearCache() {
        watchmodeService.clearCache();
        Map<String, Object> res = new HashMap<>();
        res.put("message", "In-memory API cache cleared successfully.");
        res.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @RequestHeader(value = "X-Watchmode-Api-Key", required = false) String customApiKey) {
        Map<String, Object> status = new HashMap<>();
        boolean isConfigured = watchmodeService.isApiKeyConfigured(customApiKey);
        String region = System.getProperty("aws.region", System.getenv().getOrDefault("AWS_REGION", "us-east-1"));
        
        status.put("status", "UP");
        status.put("service", "Watchmode Movie Discovery API");
        status.put("awsSecretsManagerIntegration", true);
        status.put("awsRegion", region);
        status.put("awsSecretPath", "AWS-Secrets-Manager-Demo-third-party-token");
        status.put("activeKeySource", customApiKey != null && !customApiKey.isBlank() ? "Request Header (Custom Key)" : "AWS Secrets Manager / Environment");
        status.put("cachingEnabled", true);
        status.put("apiKeyConfigured", isConfigured);
        status.put("mode", isConfigured ? "LIVE_WATCHMODE_API" : "DEMO_FALLBACK_MODE");
        status.put("javaVersion", System.getProperty("java.version", "25"));
        status.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(status);
    }
}
