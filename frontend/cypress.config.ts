import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3001',
    
    // Test files location
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.ts',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,
    
    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Default timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry configuration
    retries: {
      runMode: 2, // Retry twice in CI
      openMode: 0, // Don't retry in interactive mode
    },
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:8000',
      coverage: false, // Enable code coverage if needed
    },
    
    // Chrome flags for better performance in headless mode
    chromeWebSecurity: false,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Code coverage setup (if enabled)
      if (config.env.coverage) {
        require('@cypress/code-coverage/task')(on, config);
      }
      
      // Custom tasks
      on('task', {
        // Log messages from tests
        log(message) {
          console.log(message);
          return null;
        },
        
        // Clear database or other cleanup tasks
        clearDb() {
          // Implement database clearing logic here if needed
          return null;
        },
        
        // Seed test data
        seedDb() {
          // Implement database seeding logic here if needed
          return null;
        },
      });
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});
