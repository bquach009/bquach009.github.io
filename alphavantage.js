"use strict";
(function(){
  const ALPHA_BASE_URL = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min";
  const API_KEY = "GO0XOM99ELM2L86Q";

  /**
   * Sets up the button listener to fetch data from the Alphavantage
   * and then uses the data to plot intraday trading of the past data points.
   */
  function init() {
    id("chart-btn").addEventListener("click", fetchStock);

  }

  /**
   * Makes the fetch call to Alphavantage API
   * Upon success, shows the last 100 5 minute intervals of a stock tickers data.
   * If an error occurs, displays a message on the page appropriately.
   */
  function fetchStock() {
    // display loading text and disable button while ajax call is loading
    id("response-message").textContent = "Graphing ...";
    id("response").innerHTML = "";
    id("chart-btn").disabled = true;

    // TODO: Build URL, start fetch call chain
    if (!id("ticker").value) {
        let response = document.createElement("p");
        let msg = "Please choose a ticker first.";
        response.textContent = msg;
        id("response").appendChild(response);
        id("response-message").textContent = "Graph";
        id("chart-btn").disabled = false; // re-enable the button
    } else {
        let url = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=' + id("ticker").value.toUpperCase() + '&interval=5min&apikey=' + API_KEY;
        fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then(processStockData)
        .catch(handleRequestError);
    }
  }

  /**
   * Processes the response to display Alphavantage information on the page
   * with text content and the photo of the day. 
   * @param {Object} stockJSON - the parsed JSON object that is was returned 
   * from the request.
   */
  function processStockData(stockJSON){
    //clear response box
    id("response-message").textContent = "Graph";

    //See sample json response below
    let title = document.createElement("h2");
    title.textContent = stockJSON["Meta Data"]["2. Symbol"];

    let graph = document.createElement("div");
    graph.id = "stockGraph";

    id("response").appendChild(title);
    id("response").appendChild(graph);

    // Collect Data
    let x_data =  Object.keys(stockJSON["Time Series (5min)"]);
    let y_data = [];
    for (let key of x_data) {
        y_data.push(parseFloat(stockJSON["Time Series (5min)"][key]["4. close"]));
    }

    // Format data for Plotly
    let data = [
        {
            x: x_data, y: y_data, type:"scatter"
        }
    ];

    Plotly.newPlot('stockGraph', data);

    //re-enable button
    id("chart-btn").disabled = false;
  }

  /**
   * This function is called when an error occurs in the fetch call chain 
   * (e.g. the request returns a non-200 error code, such as when the Alphavantage 
   * service is down). Displays a user-friendly error message on the page and 
   * re-enables the stockChart button.
   * @param {Error} err - the error details of the request.
   */
  function handleRequestError(err) {
    // ajax call failed! alert, place text and re-enable the button
    let response = document.createElement("p");
    let msg = "There was an error requesting data from the Alphavantage service. " + 
              "Please check the ticker again or try again later.";
    response.textContent = msg;
    id("response").appendChild(response);
    id("response-message").textContent = "Graph";
    id("chart-btn").disabled = false; // re-enable the button
  }

  /* ------------------------------ Helper Functions  ------------------------------ */
  // Note: You may use these in your code, but do remember that your code should not have
  // any functions defined that are unused.

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Helper function to return the Response data if successful, otherwise
   * returns an Error that needs to be caught.
   * @param {object} response - response with status to check for success/error.
   * @returns {object} - The Response object if successful, otherwise an Error that
   * needs to be caught.
   */
  function checkStatus(response) {
    if (!response.ok) { // response.status >= 200 && response.status < 300
     throw Error("Error in request: " + response.statusText);
    } // else, we got a response back with a good status code (e.g. 200)
    return response; // A Response object.
  }

  init();
})();
