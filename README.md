# js_arules
https://bacloud14.github.io/js_arules/

Basically, this tiny js application accessible through a single page, uses directly the following projects:

  - https://github.com/seratch/apriori.js
  - https://github.com/tcorral/JSONC
  - https://github.com/mholt/PapaParse

Otherwise, it just exposes them to the Web.

### Contribution
Please see open issues, fork and pull request after manually testing some CSV files:

One good example can be downloaded: 

https://www.stats.govt.nz/assets/Uploads/Environmental-economic-accounts/Environmental-economic-accounts-2020-tables/Download-data/renewable-energy-stock-account-2007-18.csv

#### Test
There is obviously no automated testing, so manually verify browser console for errors, and the following functionalities that comes to mly mind should be verified:

  - Loading bar
  - Output section for plain text mined results
  - Data preview
  - Visualization: 
  Visualizations must comply with mined results (correct relationships and colorized groups)
    - Adjacency matrix
    - Weighted graph that


Quick editing on Glitch:

https://glitch.com/~js-arules

## Docker Image

This docker image simply serves the sites static content on port 80.

### Build

To build the image simply run `docker build -t IMAGE_NAME .`.

### Run

To start serving the website, run `docker run -d -p 8080:80 IMAGE_NAME .`. Now you can go to http://localhost:8080 and access Interactive Arrays!
