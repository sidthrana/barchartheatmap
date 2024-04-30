import React, { Component } from "react";
import * as d3 from "d3";
import './App.css';
import tip_data from './tips.csv';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tips: [], // To store the CSV data
      selectedOption: "tip", // Default selected radio option
      selectedCategory: "Sex", // Default selected dropdown option
      correlationMatrix: null,
      colorScale: null,
      colorBarScale: null,
      selectedVariables: null
    };
    this.handleTileClick = this.handleTileClick.bind(this);
  }

  componentDidMount() {
    d3.csv(tip_data)
      .then(data => {
        // Once the data is loaded, set it in the component state
        this.setState({ tips: data });
  
        // Calculate the correlation coefficient matrix
        const correlationMatrix = this.calculateCorrelationMatrix(data);
        // Calculate min and max correlation coefficient
        const minValue = d3.min(correlationMatrix.flat());
        const maxValue = d3.max(correlationMatrix.flat());
        // Create color scale
        const colorScale = d3.scaleLinear()
          .range(["yellow", "#0E03BB"])
          .domain([minValue, maxValue]);
        const colorBarScale = d3.scaleLinear()
          .range(["#0E03BB", "yellow"])
          .domain([minValue, maxValue]);
        this.setState({ correlationMatrix, colorScale, colorBarScale });
  
        // Render the bar chart initially
        this.renderBarChart();
      })
      .catch(error => {
        console.error('Error loading the data: ', error);
        // Handle error
      });
  }
  

  componentDidUpdate(prevProps, prevState) {
    // Check if any of the selection options have changed
    if (
      prevState.selectedCategory !== this.state.selectedCategory ||
      prevState.selectedOption !== this.state.selectedOption
    ) {
      this.renderBarChart();
    } else if (prevState.tips !== this.state.tips) {
      // If only the data has changed, re-render the bar chart
      this.renderBarChart();
    }
  }
  

  calculateCorrelationMatrix(data) {
    // Extract numerical values from the data
    const numericalData = data.map(d => ({
      tip: +d.tip,
      total_bill: +d.total_bill,
      size: +d.size
    }));

    // Calculate the correlation coefficient matrix
    const keys = Object.keys(numericalData[0]);
    const correlationMatrix = keys.map(key1 =>
      keys.map(key2 => {
        // Calculate correlation coefficient between key1 and key2
        const x = numericalData.map(d => d[key1]);
        const y = numericalData.map(d => d[key2]);
        const corr = d3.mean(x.map((d, k) => (d - d3.mean(x)) * (y[k] - d3.mean(y)))) /
          (d3.deviation(x) * d3.deviation(y));
        return corr;
      })
    );

    return correlationMatrix;
  }
  handleTileClick(row, column) {
    const selectedVariables = {
      variable1: ["tip", "total_bill", "size"][row],
      variable2: ["tip", "total_bill", "size"][column]
    };
    this.setState({ selectedVariables });
  }

  renderHeatmap() {
  const { correlationMatrix, colorScale, colorBarScale } = this.state;
  if (!correlationMatrix || !colorScale || !colorBarScale) return null;

  // Set up margin and dimensions
  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const width = 300 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // Labels of row and columns
  const myGroups = ["tip", "total_bill", "size"];
  const myVars = ["tip", "total_bill", "size"];

  // Build X scales and axis
  const x = d3.scaleBand()
    .range([0, width])
    .domain(myGroups)
    .padding(0.01);

  // Build Y scales and axis
  const y = d3.scaleBand()
    .range([height, 0])
    .domain(myVars)
    .padding(0.01);

  // Create SVG container
  return (
    <div>
      <svg width={width + margin.left + margin.right + 50} height={height + margin.top + margin.bottom + 10}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Render rectangles */}
          {correlationMatrix.map((row, i) =>
            row.map((corr, j) => (
              <g key={`${i}-${j}`}>
                <rect
                  x={x(myGroups[j])}
                  y={y(myVars[i])}
                  width={x.bandwidth()}
                  height={y.bandwidth()}
                  fill={colorScale(corr)}
                  onClick={() => this.handleTileClick(i, j)}
                />
                <text
                  x={x(myGroups[j]) + x.bandwidth() / 2}
                  y={y(myVars[i]) + y.bandwidth() / 2}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="black"
                >
                  {corr.toFixed(2)}
                </text>
              </g>
            ))
          )}
          {/* Add X axis labels */}
          {myGroups.map((group, i) => (
            <text
              key={i}
              x={x(group) + x.bandwidth() / 2}
              y={height + 20}
              textAnchor="middle"
              fill="black"
            >
              {group}
            </text>
          ))}
          {/* Add Y axis labels */}
          {myVars.map((variable, i) => (
            <text
              key={i}
              x={-margin.left / 2}
              y={y(variable) + y.bandwidth() / 2}
              dy="0.35em"
              textAnchor="middle"
              fill="black"
              fontSize="7"
            >
              {variable}
            </text>
          ))}
        </g>
        {/* Color bar */}
        <g transform={`translate(${width + margin.left + 10},${margin.top})`}>
          <rect width={20} height={height} style={{ fill: "url(#gradient)" }} />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              {colorBarScale.ticks(10).map((tick, i) => (
                <stop key={i} offset={`${(i * 100) / 10}%`} stopColor={colorBarScale(tick)} />
              ))}
            </linearGradient>
          </defs>
          {/* Add numerical values */}
          {colorBarScale.ticks(10).map((tick, i) => (
            <g key={i} transform={`translate(0, ${height - (i * height / 10)})`}>
              <text x={25} y={10} style={{ fontSize: 10 }}>{tick.toFixed(2)}</text>
            </g>
          ))}
          {/* Display max value */}
          <text x={25} y={10} style={{ fontSize: 10 }}>{colorBarScale.domain()[1].toFixed(2)}</text>
        </g>
      </svg>
    </div>
    
  );
}


renderBarChart() {
  const { tips, selectedCategory, selectedOption } = this.state;

  // Filter data based on the selected category
  const filteredData = tips.map(d => ({
    category: d[selectedCategory],
    value: +d[selectedOption] // Convert string to number
  }));

  // Group data by category
  const groupedData = d3.group(filteredData, d => d.category);

  // Calculate average value for each category
  const aggregatedData = Array.from(groupedData, ([key, value]) => ({
    key,
    value: d3.mean(value, d => d.value)
  }));

  // Clear existing SVG
  d3.select("#demo2").selectAll("*").remove();

  // Set up SVG dimensions
  const margin = { top: 20, right: 20, bottom: 50, left: 50 }; // Adjusted bottom margin for axis labels
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // Create SVG element
  const svg = d3.select("#demo2")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales
  const x = d3.scaleBand()
    .domain(aggregatedData.map(d => d.key))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregatedData, d => d.value)])
    .nice()
    .range([height, 0]);

  // Draw bars
  svg.selectAll(".bar")
    .data(aggregatedData)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value));

  // Draw x-axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append("text") // X axis label
    .attr("x", width / 2)
    .attr("y", margin.bottom - 10) // Adjusted margin for axis label
    .attr("fill", "#000")
    .style("text-anchor", "middle")
    .text(selectedCategory); // Use selected category as label

  // Draw y-axis
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y))
    .append("text") // Y axis label
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10) // Adjusted margin for axis label
    .attr("x", -height / 2)
    .attr("dy", "0.71em")
    .attr("fill", "#000")
    .style("text-anchor", "middle")
    .text(selectedOption + " (Average)"); // Use selected option as label
}



  render() {
    const { selectedVariables } = this.state; // Retrieve selectedVariables from state
  
    return (
      <div>
        <div>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Select Target:
              <select onChange={(event) => this.setState({ selectedCategory: event.target.value })}>
                <option value="sex">Sex</option>
                <option value="smoker">Smoker</option>
                <option value="day">Day</option>
                <option value="time">Time</option>
              </select>
            </div>
        </div>
<div style={{ display: 'flex' }}>
  {/* Bar Chart */}
  
  <div style={{ flex: 1, padding: 10 }} align="center">
  <input type="radio" id="tip" name="option" value="tip" checked={this.state.selectedOption === 'tip'} onChange={() => this.setState({ selectedOption: 'tip' })} />
    <label htmlFor="tip">Tip</label>
    <input type="radio" id="totalBill" name="option" value="total_bill" checked={this.state.selectedOption === 'total_bill'} onChange={() => this.setState({ selectedOption: 'total_bill' })} />
    <label htmlFor="totalBill">Total Bill</label>
    <input type="radio" id="size" name="option" value="size" checked={this.state.selectedOption === 'size'} onChange={() => this.setState({ selectedOption: 'size' })} />
    <label htmlFor="size">Size</label>
    <br />
    <svg id="demo2" width="500" height="300"></svg>
  </div>
  {/* Heatmap */}
  <div style={{ flex: 1, padding: 50, marginLeft: '40px' }} align="center">
    Correlation Matrix
    {this.renderHeatmap()}
  </div>
</div>

        </div>
        {/* Second row */}
        <div>
          {/* Scatterplot */}
          <div id="demo3" align="center">
            <Scatterplot
              data={tip_data}
              variable1={selectedVariables ? selectedVariables.variable1 : null} // Pass selectedVariables as props
              variable2={selectedVariables ? selectedVariables.variable2 : null} // Pass selectedVariables as props
            />
          </div>
        </div>
      </div>
    );
  }
  
  
  
}
class Scatterplot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }

  componentDidMount() {
    // Fetch data and update state
    d3.csv(this.props.data)
      .then((data) => {
        this.setState({ data });
      })
      .catch((error) => {
        console.error("Error loading scatterplot data: ", error);
      });
  }

  render() {
    const { data } = this.state;
    const { variable1, variable2 } = this.props;

    // Filter data based on selected variables
    const filteredData = data.map((d) => ({
      x: +d[variable1],
      y: +d[variable2],
    }));

    // Set up margin and dimensions
    const margin = { top: 30, right: 30, bottom: 60, left: 60 }; // Increased bottom margin for axis labels
    const width = 1000 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Calculate scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.x)])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.y)])
      .range([height, 0]);

    return (
      <div>
        <h2>
          Scatterplot between {variable1} and {variable2}
        </h2>
        <svg
          width={width + margin.left + margin.right}
          height={height + margin.top + margin.bottom}
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Draw circles */}
            {filteredData.map((d, i) => (
              <circle
                key={i}
                cx={xScale(d.x)}
                cy={yScale(d.y)}
                r={5} // radius of the circle
                fill="steelblue"
              />
            ))}
            {/* X-axis */}
            <g
              transform={`translate(0, ${height})`}
              ref={(node) =>
                d3.select(node).call(d3.axisBottom(xScale).ticks(5))
              }
            >
              {/* X-axis label */}
              <text
                x={width / 2}
                y={margin.bottom - 10} // Adjusted position for axis label
                textAnchor="middle"
                fill="black"
              >
                {variable1}
              </text>
            </g>
            {/* Y-axis */}
            <g
              ref={(node) => d3.select(node).call(d3.axisLeft(yScale).ticks(5))}
            >
              {/* Y-axis label */}
              <text
                x={-height / 2}
                y={-margin.left + 20} // Adjusted position for axis label
                transform="rotate(-90)"
                textAnchor="middle"
                color="black"
                fill="black"
              >
                {variable2}
              </text>
            </g>
          </g>
        </svg>
      </div>
    );
  }

  
  
}

export default App;


