[![DOI](https://zenodo.org/badge/518437897.svg)](https://zenodo.org/badge/latestdoi/518437897)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/fusion-jena/wiki-category-consistency/blob/master/LICENSE)

# Consistency between Wikidata and Wikipedia Categories

- We perform an analysis of consistencies between [Wikipedia category](https://en.wikipedia.org/wiki/Wikipedia:Categorization) members and their Wikidata counterpart entities retrieved by executing the SPARQL queries attached to the Wikidata categories under the property [Wikidata SPARQL query equivalent](https://www.wikidata.org/wiki/Property:P3921).
- We focus on comparing the member sets of the two sources, and automatically investigating possible reasons making them not identical, in addition to a comparison of the consistency of the information provided within the Wikidata category itself.
- For that, we propose a pipeline for the generation and evaluation of relevant data (categories and Wikidata/Wikipedia entities sets).
- Wikipedia category members are retrieved by traversing the Wikipedia category hierarchy in all available languages.
- This repository provides the steps needed to either reproduce the current results or conduct a new experiment using other Wikipedia/Wikidata versions.
- The pipeline works using both Wikipedia/Wikidata public endpoints and SQL/JSON dumps.
- Our experiments were run using **the Wikidata JSON dump of 2022-05-02 and the Wikipedia SQL dumps of 2022-05-01**.

# Candidate Generation and Evaluation

![approach!](figs/approach.png)

- The figure above depicts the workflow for data generation and evaluation (see paper for more details).

## Cache Population

- We provide two options to run the generation workflow:

### From Dumps

1. First, two kind of dump versions should be selected:
  - [Wikidata JSON Dump](https://dumps.wikimedia.org/wikidatawiki/entities/) (`wikidata-<version>-all.json.gz`)
  - [Wikipedia SQL Dumps](https://dumps.wikimedia.org/backup-index.html) (available dataset versions could be checked by visiting e.g., [enwiki](https://dumps.wikimedia.org/enwiki/) for English Wikipedia)
  
2. Second, Setup a MariaDB database (place where Wikipedia SQL Dumps will be imported)
  - Install MariaDB : `sudo apt-get install mariadb-server`.
  - Set root password:
    ```
    $ sudo mysql -u root
    MariaDB [(none)]> SET PASSWORD = PASSWORD('DB_PASSWORD');
    MariaDB [(none)]> update mysql.user set plugin = 'mysql_native_password' where User='root';
    MariaDB [(none)]> FLUSH PRIVILEGES;
    ```
  - Create a Database:
    ```
    $ sudo mysql -u root
    MariaDB [(none)]> create database <DB_NAME> character set binary;
    Query OK, 1 row affected (0.00 sec)

    MariaDB [(none)]> use <DB_NAME>;
    Database changed
    ```
  - Optimize Database import by setting following parameter in `/etc/mysql/my.cnf` and then restart the database server `service mysql restart`.
  ```
  wait_timeout = 604800
  innodb_buffer_pool_size = 8G
  innodb_log_buffer_size = 1G
  innodb_log_file_size = 512M
  innodb_flush_log_at_trx_commit = 2
  innodb_doublewrite = 0
  innodb_write_io_threads = 16
  ```
3. Update [configuration file](https://github.com/fusion-jena/wiki-category-consistency/blob/master/src/cache-population/config.js) in `./src/cache-population/config.js`
  ```
  // wikidata dump version
  wdDump: path.join(__dirname,'..', '..', '..', 'wikidata-<version>-all.json.gz'),
  // wikipedia dump version
  dumpDate : <wikipedia-version>,
  // wikipedia database user
  user: 'root',
  // wikipedia database password
  password: <DB_PASSWORD>,
  // wikipedia database name
  databaseName: <DB_NAME>,
  ```
4. Install [Node.js (minimum v14.16.1)](https://nodejs.org/en/)
5. First download the repository and install dependencies: run `npm install` in the project root folder.
6. Populate caches from dumps : `npm run runner`
7. Continue with the steps described under [Candidate Generation and Cleaning](#candidate-generation-and-cleaning)

### From Endpoints

- This option does not need local setup or prior cache population.
- It allows to directly send requests to Wikidata/Wikipedia public endpoints:
	- [Wikidata public endpoint](https://query.wikidata.org/sparql)
	- [MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page)
- To generate relevant data from endpoints, the steps under [Candidate Generation and Cleaning](#candidate-generation-and-cleaning) can directly be followed.

## Candidate Generation and Cleaning

- **To reproduce the current experiments**, one can make use of the already filled caches provided on Zenodo: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.6913134.svg)](https://doi.org/10.5281/zenodo.6913134).
	- A collection of SQLite database files containing all data retrieved from the Wikidata JSON dump of 2022-05-02 and the Wikipedia SQL dumps of 2022-05-01.

- To reproduce current experiments or perform new ones, the steps below should be followed (start directly with step 3 if Node.js and dependencies were already installed in [From Dumps](#from-dumps)):

1. Install [Node.js (minimum v14.16.1)](https://nodejs.org/en/)
2. First download the repository and install dependencies: run `npm install` in the project root folder.
3.  
  * *Generate from Endpoints* : setup `endpointEnabled: true` in `./src/config/config.js`.
  * *Generate from Dumps* : setup `endpointEnabled: false` in `./src/config/config.js`.
  * *Reproduce current experiments* : setup `endpointEnabled: false` in `./src/config/config.js`. In the root folder create a folder `./cache/`, unzip `wiki-category-consistency-cache.zip` and copy the content of the underlying folder (cache) in the newly created `cache` folder.
4. To generate candidate categories run `npm run generateCandidate` in the root folder. The output files can be found under `./dataset/` . The output is a JSON file containing all needed raw data needed for further processing: `./dataset/raw-data.json`, in addition to log and statistics files.
5. Next, for candidate cleaning, run `npm run cleanCandidate` in the root folder. The output is a JSON file with selected category entries: `./dataset/finalData.json` together with statistics file.

- The output of the candidate generation and cleaning steps using the Wikidata JSON dump of 2022-05-02 and the Wikipedia SQL dumps of 2022-05-01 (`./dataset/raw-data.json`, `./dataset/finalData.json`, and accompanying files) are provided on Zenodo: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.6913282.svg)](https://doi.org/10.5281/zenodo.6913282).

## Evaluation

- The evaluation takes as input the file with cleaned category entries `./dataset/finalData.json`.

1. Generate the needed evaluation metrics by running `npm run compareSPARQL` in the root folder. The output is a JSON file `./eval/compare.json` together with an additional statistics file.
2. Plot the charts by running `npm run generatePlots` in the root folder. The output is a collection of html files under the folder `./charts/`.

- Experiment results (`./eval/compare.json` with a statistics file) using the previously mentioned dump versions, are provided on Zenodo: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.6913332.svg)](https://doi.org/10.5281/zenodo.6913332).

## Citation
```
@inproceedings{DBLP:conf/semweb/Feddoul0S22,
  author       = {Leila Feddoul and
                  Frank L{\"{o}}ffler and
                  Sirko Schindler},
  editor       = {Lucie{-}Aim{\'{e}}e Kaffee and
                  Simon Razniewski and
                  Gabriel Amaral and
                  Kholoud Saad Alghamdi},
  title        = {Analysis of Consistency between Wikidata and Wikipedia categories},
  booktitle    = {Proceedings of the 3rd Wikidata Workshop 2022 co-located with the
                  21st International Semantic Web Conference (ISWC2022), Virtual Event,
                  Hanghzou, China, October 2022},
  series       = {{CEUR} Workshop Proceedings},
  volume       = {3262},
  publisher    = {CEUR-WS.org},
  year         = {2022},
  url          = {https://ceur-ws.org/Vol-3262/paper4.pdf}
}
```

## License

This project is licensed under the [MIT License](https://github.com/fusion-jena/wiki-category-consistency/blob/master/LICENSE).


