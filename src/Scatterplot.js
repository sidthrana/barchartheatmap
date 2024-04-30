import React from "react";
import * as d3 from "d3";

class Scatterplot extends React.Component {
  constructor(props) {
    super(props);
    this.scatterRef = React.createRef();
  }

  componentDidMount() {
    // Render scatterplot when component mounts
    this.renderScatterplot();
  }

  componentDidUpdate(prevProps) {
    // Re-render scatterplot when selected variables or data change
    if (
      prevProps.selectedVariables !== this.props.selectedVariables ||
      prevProps.data !== this.props.data
    ) {
      this.renderScatterplot();
    }
  }

  renderScatterplot() {
    const { selectedVariables, data } = this.props;
    if (!selectedVariables || selectedVariables.length !== 2 || !data) return;

    const [variable1, variable2] = selectedVariables;

    // Clear existing scatterplot
    d3.select(this.scatterRef.current).selectAll("*").remove();

    // Set up SVG dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select(this.scatterRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d[variable1]))
      .nice()
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d[variable2]))
      .nice()
      .range([height, 0]);

    // Draw circles
    svg.selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("cx", d => xScale(d[variable1]))
      .attr("cy", d => yScale(d[variable2]))
      .attr("r", 5)
      .style("fill", "steelblue");

    // Draw x-axis
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("x", width)
      .attr("y", -6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text(variable1);

    // Draw y-axis
    svg.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text(variable2);
  }

  render() {
    return <svg ref={this.scatterRef}></svg>;
  }
}

export default Scatterplot;
