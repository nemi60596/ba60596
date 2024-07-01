### Quickstart

        
1. **Initial Setup:**
    
    - Run the setup command to install all dependencies.
              
        `yarn setup` 
        
2. **Start the Development Server:**
    
    - Start the development server to run the application in development mode, which rebuilds assets on file changes.
        
        `yarn dev` 
        

### Prerequisites

- **Node.js:** Ensure that Node.js is installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).
- **Yarn:** Make sure you have Yarn installed. You can install it globally using npm:
    
    `npm install -g yarn` 
    
### Description of Routes

The `way-wise` application contains various routes that handle different functionalities of the app. Here is a description of the main routes:

1. **Root Route (`/`)**
    
    - This is the main entry point of the application, typically rendering the home page or dashboard.
2. **Add Raw Routes (`/addRawRoutes`)**
    
    - Allows users to add raw routes to the application. This can be used to upload or input route data that the application will process.
3. **Add References (`/addReferences`)**
    
    - Enables users to add reference data to the application. Reference data might include points of interest, landmarks, or other static data relevant to routing.
4. **Analyse Stats (`/analyseStats`)**
    
    - Provides tools and visualizations for analyzing statistical data related to the routes and references. Users can view various metrics and insights.
5. **Benchmark (`/benchmark`)**
    
    - Allows users to run and view benchmarks. This route is used to compare the performance of different routing configurations or datasets.
6. **Check Compareable Routes (`/checkCompareableRoutes`)**
    
    - Checks if routes are comparable based on certain criteria. This ensures that comparisons are valid and meaningful.
7. **Compare Snapshots (`/compareSnapshots`)**
    
    - Enables users to compare different snapshots of the application’s data. This is useful for seeing changes over time or between different data states.
8. **Create Run (`/createRun`)**
    
    - Allows users to initiate a new run. A run could be a specific routing calculation or data processing task.
9. **Duplicate Map (`/duplicateMap`)**
    
    - Provides functionality to duplicate maps within the application. This can be useful for creating backups or working on map variations.
10. **Geo Benchmark (`/geo.$benchmarkId`)**
    
    - Displays benchmarking data for a specific geographic benchmark identified by `$benchmarkId`.
11. **Healthcheck (`/healthcheck`)**
    
    - A route used to check the health status of the application. This can be used for monitoring and maintenance purposes.
12. **Raw Routes Analyse (`/rawRoutesAnalyse`)**
    
    - Analyzes the raw routes that have been added to the application. This route provides detailed insights and metrics.
13. **Raw Routes Without Reference (`/rawRoutesWithoutReference`)**
    
    - Displays raw routes that do not have corresponding reference data. This helps in identifying and resolving missing data issues.
14. **Results Table (`/resultsTable.$runId`)**
    
    - Displays the results of a specific run identified by `$runId`. Users can view detailed outcomes and data.
15. **RTT Analyse (`/rttAnalyse`)**
    
    - Analyzes Round Trip Time (RTT) data for routes. This is useful for performance analysis and optimization.
16. **Save Snapshot (`/savesnapshot`)**
    
    - Allows users to save the current state of the application’s data as a snapshot. This is useful for creating restore points.
17. **Select Routes (`/selectRoutes.$runId`)**
    
    - Provides a user interface to select routes for a specific run identified by `$runId`.
18. **Update Snapshot (`/updateSnapshot`)**
    
    - Enables users to update an existing snapshot with new data or changes.


## TO DOES
- cleanup code
- fix database schema
- fix ui bugs
- ui streaming 
- fix typos
- clean up dependencies