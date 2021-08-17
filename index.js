/* eslint-disable linebreak-style */
/* eslint-disable func-names */
/* eslint-disable no-undef */
// ! Various functions below

// TODO - For defining colors
function defineColors(nameData) {
  const steps = 9;
  const start = d3.min(nameData, (d) => d.bachelorsOrHigher);
  const end = d3.max(nameData, (d) => d.bachelorsOrHigher);
  const interval = (end - start) / steps;
  const arrayWithSteps = Array(steps)
    .fill()
    .map((_, i) => [start + i * interval] / 100);
  const colorPallette = d3
    .scaleThreshold()
    .domain(arrayWithSteps)
    .range(d3.schemeOrRd[steps]);
  return colorPallette;
}
// TODO - For combining bachelors or higher data
function bachelorsOrHigherFunc(nameData) {
  const bachOrHigh = nameData.reduce((accumulator, d) => {
    accumulator[d.fips] = d.bachelorsOrHigher;
    return accumulator;
  }, {});
  return bachOrHigh;
}
// TODO - For combining area name data
function areaNameFunc(nameData) {
  const arrayName = nameData.reduce((accumulator, d) => {
    accumulator[d.fips] = d.area_name;
    return accumulator;
  }, {});
  return arrayName;
}
// TODO - For combining state name data
function stateNameFunc(nameData) {
  const stateName = nameData.reduce((accumulator, d) => {
    accumulator[d.fips] = d.state;
    return accumulator;
  }, {});
  return stateName;
}

// ! Drawing begins here
// * Defining width and height of svg
const width = 1100;
const height = 700;

// * Defining svg for drawing
const choroplethMap = d3
  .select('body')
  .append('svg')
  .attr('height', height)
  .attr('width', width)
  .attr('class', 'choroplethMap');
// ! Margin convention
margin = {
  top: 60, right: 30, bottom: 0, left: 70,
};
const innerWidth = width - margin.right - margin.left;
// * Defining selector and path generator
const subgroupForDrawing = choroplethMap
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);
// subgroupForDrawing.attr("transform", "translate(20px, 200px)");
const pathGenerator = d3.geoPath();

// * Combining multiple json files to utilize data
Promise.all([
  d3.json(
    'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json',
  ),
  d3.json(
    'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json',
  ),
]).then(([drawingData, nameData]) => {
  // ! Defining objects for use in tooltip and rendering colors
  const bachelorsOrHigher = bachelorsOrHigherFunc(nameData);
  const areaName = areaNameFunc(nameData);
  const stateName = stateNameFunc(nameData);

  // * Parsing the raw data using topojson
  const counties = topojson.feature(drawingData, drawingData.objects.counties);
  const states = topojson.feature(drawingData, drawingData.objects.states);

  // * Defining color pallette
  const colors = defineColors(nameData);
  const tooltipForData = d3
    .select('body')
    .append('div')
    .attr('id', 'tooltip')
    .style('opacity', 0);
  // * Drawing the data

  subgroupForDrawing
    .selectAll('path')
    .data(counties.features)
    .enter()
    .append('path')
    .attr('d', pathGenerator)
    .style('fill', 'none')
    .style('stroke', 'black')
    .attr('data-fips', (d) => d.id)
    .attr('data-education', (d) => bachelorsOrHigher[d.id])
    .style('fill', (d) => colors(bachelorsOrHigher[d.id] / 100))
    .attr('class', 'county')
    .on('mouseover', function (event, d) {
      d3.select(this).style('fill', 'steelblue');
      tooltipForData.transition().style('opacity', 0.85);
      tooltipForData
        .html(
          `${areaName[d.id]
          } - ${
            stateName[d.id]
          } - ${
            bachelorsOrHigher[d.id]
          }%`,
        )
        .style('left', `${parseFloat(event.pageX) + 30}px`)
        .style('top', `${event.pageY - 30}px`)
        .attr('data-education', bachelorsOrHigher[d.id]);
    })
    .on('mouseout', function () {
      tooltipForData.transition().style('opacity', 0);
      d3.select(this).style('fill', (d) => colors(bachelorsOrHigher[d.id] / 100));
    });
  subgroupForDrawing
    .append('g')
    .selectAll('path')
    .data(states.features)
    .enter()
    .append('path')
    .attr('d', pathGenerator)
    .style('fill', 'none')
    .attr('class', 'states');
  subgroupForDrawing
    .append('text')
    .text('United States Educational Attainment')
    .attr('id', 'title')
    .attr('x', innerWidth / 2)
    .attr('y', -10);
  subgroupForDrawing
    .append('text')
    .text(
      "Percentage of adults aged 25 and older with a bachelor's degree or higher (2010-2014)",
    )
    .attr('id', 'description')
    .attr('x', innerWidth / 2)
    .attr('y', 20);
  // * Defining legend using dependency
  // eslint-disable-next-line no-use-before-define
  defineLegend(colors);
  // ! Adding source
  const divSource = d3
    .select('svg')
    .append('g')
    .attr(
      'transform',
      `translate(${width - margin.right - 20}, ${height - 20})`,
    );
  divSource
    .append('text')
    .attr('class', 'textSource')
    .text('Data source: ')
    .append('a')
    .attr('class', 'linkSource')
    .attr(
      'href',
      'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json',
    )
    .attr('target', '_blank')
    .text('https://cdn.freecodecamp.org/testable-projects-fcc/...');

  // ! Adding author
  const author = d3
    .select('svg')
    .append('g')
    .attr('transform', `translate(${60}, ${height - 200})`);
  author
    .append('text')
    .attr('class', 'nameAuthor')
    .text('Created by ')
    .append('a')
    .attr('href', 'https://www.linkedin.com/in/davor-jovanovi%C4%87/')
    .attr('target', '_blank')
    .text('DavorJ');
});
// TODO - Defining legend
function defineLegend(colors) {
  choroplethMap
    .append('g')
    .attr('class', 'legendSequential')
    .attr('transform', `translate(${innerWidth - 70}, ${height / 2 + 110})`);

  const legendSequential = d3
    .legendColor()
    .shapeWidth(30)
    .shapeHeight(15)
    .shapePadding(0)
    .title('Legend')
    .titleWidth(20)
    .labelFormat(d3.format('.1%'))
    .labels(d3.legendHelpers.thresholdLabels)
    .orient('vertical')
    .scale(colors);
  choroplethMap
    .select('.legendSequential')
    .call(legendSequential)
    .attr('id', 'legend')
    .append('rect')
    .attr('x', -10)
    .attr('y', -15)
    .attr('width', '132px')
    .attr('height', '200px')
    .attr('fill', 'none')
    .attr('stroke', 'black');
}
