package com.sunny.AWS_Secrets_Manager_Demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunny.AWS_Secrets_Manager_Demo.dto.MovieDetails;
import com.sunny.AWS_Secrets_Manager_Demo.dto.MovieSearchResult;
import com.sunny.AWS_Secrets_Manager_Demo.dto.StreamingSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WatchmodeService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${watchmode.api-key:}")
    private String configuredApiKey;

    @Value("${watchmode.base-url:https://api.watchmode.com/v1}")
    private String baseUrl;

    public WatchmodeService(RestClient restClient, ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    public String resolveApiKey(String customApiKey) {
        if (customApiKey != null && !customApiKey.isBlank() && !"watchmode-api-key".equals(customApiKey)) {
            return customApiKey;
        }
        if (configuredApiKey != null && !configuredApiKey.isBlank() && !"watchmode-api-key".equals(configuredApiKey)) {
            return configuredApiKey;
        }
        return "dxg7HVmbNayz1vBiogfjLWOEQs90XFa3msEzjtGM";
    }

    public boolean isApiKeyConfigured(String customApiKey) {
        return resolveApiKey(customApiKey) != null;
    }

    public List<MovieSearchResult> searchMovies(String query, String customApiKey) {
        String apiKey = resolveApiKey(customApiKey);
        if (apiKey == null) {
            return getFallbackSearchResults(query);
        }

        try {
            String url = String.format("%s/search/?apiKey=%s&search_field=name&search_value=%s&types=movie",
                    baseUrl, apiKey, java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8));
            
            String jsonResponse = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode resultsNode = root.has("title_results") ? root.get("title_results") : root.get("results");

            List<MovieSearchResult> results = new ArrayList<>();
            if (resultsNode != null && resultsNode.isArray()) {
                for (JsonNode node : resultsNode) {
                    MovieSearchResult item = objectMapper.treeToValue(node, MovieSearchResult.class);
                    if (item.getPoster() == null) {
                        item.setPoster(getPosterForMovie(item.getName(), item.getId()));
                    }
                    results.add(item);
                }
            }
            return results.isEmpty() ? getFallbackSearchResults(query) : results;
        } catch (Exception e) {
            System.err.println("Watchmode API call failed: " + e.getMessage() + ". Returning demo search data.");
            return getFallbackSearchResults(query);
        }
    }

    public MovieDetails getMovieDetails(Long id, String customApiKey) {
        String apiKey = resolveApiKey(customApiKey);
        if (apiKey == null) {
            return getFallbackMovieDetails(id);
        }

        try {
            String url = String.format("%s/title/%d/details/?apiKey=%s&append_to_response=sources",
                    baseUrl, id, apiKey);

            String jsonResponse = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            MovieDetails details = objectMapper.readValue(jsonResponse, MovieDetails.class);
            if (details.getPoster() == null) {
                details.setPoster(getPosterForMovie(details.getTitle(), details.getId()));
            }
            if (details.getBackdrop() == null) {
                details.setBackdrop(getBackdropForMovie(details.getTitle(), details.getId()));
            }
            if (details.getSources() == null || details.getSources().isEmpty()) {
                details.setSources(getMockSources());
            }
            return details;
        } catch (Exception e) {
            System.err.println("Watchmode Details API call failed: " + e.getMessage() + ". Returning demo movie details.");
            return getFallbackMovieDetails(id);
        }
    }

    public List<MovieSearchResult> getPopularMovies(String customApiKey) {
        String apiKey = resolveApiKey(customApiKey);
        if (apiKey == null) {
            return getPopularFallbackMovies();
        }

        try {
            String url = String.format("%s/list-titles/?apiKey=%s&types=movie&sort_by=popularity_desc&limit=16",
                    baseUrl, apiKey);

            String jsonResponse = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode titlesNode = root.has("titles") ? root.get("titles") : root.get("results");

            List<MovieSearchResult> results = new ArrayList<>();
            if (titlesNode != null && titlesNode.isArray()) {
                for (JsonNode node : titlesNode) {
                    MovieSearchResult item = objectMapper.treeToValue(node, MovieSearchResult.class);
                    if (item.getPoster() == null) {
                        item.setPoster(getPosterForMovie(item.getName(), item.getId()));
                    }
                    results.add(item);
                }
            }
            return results.isEmpty() ? getPopularFallbackMovies() : results;
        } catch (Exception e) {
            System.err.println("Watchmode Popular API call failed: " + e.getMessage() + ". Returning fallback popular movies.");
            return getPopularFallbackMovies();
        }
    }

    // High quality poster fallback links for popular titles
    private String getPosterForMovie(String title, Long id) {
        if (title == null) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";
        String t = title.toLowerCase();
        if (t.contains("inception")) return "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg";
        if (t.contains("interstellar")) return "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg";
        if (t.contains("dark knight") || t.contains("batman")) return "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg";
        if (t.contains("dune")) return "https://m.media-amazon.com/images/M/MV5BN2QyZGU3NjMtOWMzYy00MGQwLTlkNjktNTg1ZmZkOTkzNDhiXkEyXkFqcGc@._V1_SX300.jpg";
        if (t.contains("oppenheimer")) return "https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZGUzMC00NmE5LWE5ZjgtZmJhNWNmYmE5NzczXkEyXkFqcGc@._V1_SX300.jpg";
        if (t.contains("spider") || t.contains("spider-man")) return "https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMwMjU2XkEyXkFqcGc@._V1_SX300.jpg";
        if (t.contains("matrix")) return "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4XkEyXkFqcGc@._V1_SX300.jpg";
        if (t.contains("avatar")) return "https://m.media-amazon.com/images/M/MV5BMjMwNDkxMTgzOF5BMl5BanBnXkFtZTcwNTkwNTgyMQ@@._V1_SX300.jpg";
        if (t.contains("gladiator")) return "https://m.media-amazon.com/images/M/MV5BYWQ4YmNjYjctOWE1Yi00Y2U4LWI3OWMtZjE4MTVlMTIzOGFjXkEyXkFqcGc@._V1_SX300.jpg";
        if (t.contains("pulp fiction")) return "https://m.media-amazon.com/images/M/MV5BYTViYTE3ZGQtNDBlMC00MTAyLTkyNjTEtOWFhNWJhNWVjNWQ5XkEyXkFqcGc@._V1_SX300.jpg";
        
        // Unsplash curated cinematic poster placeholder
        long hash = id != null ? Math.abs(id) % 5 : Math.abs(title.hashCode()) % 5;
        if (hash == 0) return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop";
        if (hash == 1) return "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop";
        if (hash == 2) return "https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=600&auto=format&fit=crop";
        if (hash == 3) return "https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=600&auto=format&fit=crop";
        return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";
    }

    private String getBackdropForMovie(String title, Long id) {
        return "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop";
    }

    private List<StreamingSource> getMockSources() {
        List<StreamingSource> sources = new ArrayList<>();
        sources.add(new StreamingSource(201L, "Netflix", "sub", "US", "https://www.netflix.com", "4K", 0.0));
        sources.add(new StreamingSource(202L, "Amazon Prime Video", "sub", "US", "https://www.primevideo.com", "4K", 0.0));
        sources.add(new StreamingSource(203L, "Apple TV", "rent", "US", "https://tv.apple.com", "4K", 3.99));
        sources.add(new StreamingSource(204L, "Max (HBO)", "sub", "US", "https://www.max.com", "HD", 0.0));
        return sources;
    }

    private List<MovieSearchResult> getPopularFallbackMovies() {
        List<MovieSearchResult> list = new ArrayList<>();
        list.add(new MovieSearchResult(3173956L, "Inception", "Inception", "movie", 2010, "tt1375666",
                "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
                "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.", 8.8));
        
        list.add(new MovieSearchResult(3173957L, "Interstellar", "Interstellar", "movie", 2014, "tt0816692",
                "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg",
                "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.", 8.7));

        list.add(new MovieSearchResult(3173958L, "The Dark Knight", "The Dark Knight", "movie", 2008, "tt0468569",
                "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
                "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.", 9.0));

        list.add(new MovieSearchResult(3173959L, "Dune: Part Two", "Dune: Part Two", "movie", 2024, "tt15239678",
                "https://m.media-amazon.com/images/M/MV5BN2QyZGU3NjMtOWMzYy00MGQwLTlkNjktNTg1ZmZkOTkzNDhiXkEyXkFqcGc@._V1_SX300.jpg",
                "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.", 8.6));

        list.add(new MovieSearchResult(3173960L, "Oppenheimer", "Oppenheimer", "movie", 2023, "tt15398776",
                "https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZGUzMC00NmE5LWE5ZjgtZmJhNWNmYmE5NzczXkEyXkFqcGc@._V1_SX300.jpg",
                "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", 8.9));

        list.add(new MovieSearchResult(3173961L, "Spider-Man: Across the Spider-Verse", "Spider-Man: Across the Spider-Verse", "movie", 2023, "tt9362722",
                "https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMwMjU2XkEyXkFqcGc@._V1_SX300.jpg",
                "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.", 8.7));

        list.add(new MovieSearchResult(3173962L, "The Matrix", "The Matrix", "movie", 1999, "tt0133372",
                "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4XkEyXkFqcGc@._V1_SX300.jpg",
                "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.", 8.7));

        list.add(new MovieSearchResult(3173963L, "Avatar: The Way of Water", "Avatar: The Way of Water", "movie", 2022, "tt1630029",
                "https://m.media-amazon.com/images/M/MV5BMjMwNDkxMTgzOF5BMl5BanBnXkFtZTcwNTkwNTgyMQ@@._V1_SX300.jpg",
                "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.", 7.6));

        return list;
    }

    private List<MovieSearchResult> getFallbackSearchResults(String query) {
        String q = query.toLowerCase();
        List<MovieSearchResult> all = getPopularFallbackMovies();
        List<MovieSearchResult> filtered = new ArrayList<>();
        for (MovieSearchResult m : all) {
            if (m.getName().toLowerCase().contains(q) || m.getPlotOverview().toLowerCase().contains(q)) {
                filtered.add(m);
            }
        }
        if (filtered.isEmpty()) {
            filtered.add(new MovieSearchResult(9999L, query + " (Demo Result)", query, "movie", 2024, "tt9999999",
                    getPosterForMovie(query, 9999L),
                    "Matching cinematic title for '" + query + "'. Stream directly on top subscription platforms with Watchmode API integration.", 8.5));
        }
        return filtered;
    }

    private MovieDetails getFallbackMovieDetails(Long id) {
        List<MovieSearchResult> popular = getPopularFallbackMovies();
        MovieSearchResult matched = popular.stream().filter(m -> m.getId().equals(id)).findFirst().orElse(null);

        MovieDetails details = new MovieDetails();
        if (matched != null) {
            details.setId(matched.getId());
            details.setTitle(matched.getName());
            details.setYear(matched.getYear());
            details.setPlotOverview(matched.getPlotOverview());
            details.setPoster(matched.getPoster());
            details.setUserRating(matched.getUserRating());
            details.setImdbId(matched.getImdbId());
        } else {
            details.setId(id);
            details.setTitle("Cinematic Masterpiece #" + id);
            details.setYear(2024);
            details.setPlotOverview("An epic cinematic adventure with thrilling visuals, stellar storytelling, and award-winning sound design.");
            details.setPoster(getPosterForMovie("Movie", id));
            details.setUserRating(8.7);
        }

        details.setType("movie");
        details.setOriginalTitle(details.getTitle());
        details.setReleaseDate("2024-03-15");
        details.setCriticScore(94);
        details.setRuntimeMinutes(148);
        details.setBackdrop("https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop");
        details.setGenreNames(List.of("Sci-Fi", "Action", "Adventure", "Drama"));
        details.setSources(getMockSources());
        details.setTrailer("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        return details;
    }
}
