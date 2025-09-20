package com.example.jiratestgenerator.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {
    
    /**
     * Serve the main application page
     */
    @GetMapping("/")
    public String index() {
        return "index";
    }
    
    /**
     * Handle any other routes and redirect to main page
     */
    @GetMapping("/{path:[^\\.]*}")
    public String redirect() {
        return "index";
    }
}
