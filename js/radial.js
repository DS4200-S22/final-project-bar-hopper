// Reference: https://www.movable-type.co.uk/scripts/latlong.html
function distance(location1, location2) {
    const R = 6371e3;
    const lat1 = location1.lat * Math.PI / 180; // lat1, lat2 in radians
    const lat2 = location2.lat * Math.PI / 180;
    const latDiff = (location2.lat - location1.lat) * Math.PI / 180;
    const logDiff = (location2.log - location1.log) * Math.PI / 180;

    const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(logDiff / 2) * Math.sin(logDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function bearing(location1, location2) {
    const lat1 = location1.lat * Math.PI / 180; // lat1, lat2, log1, log2 in radians
    const lat2 = location2.lat * Math.PI / 180;
    const log1 = location1.log * Math.PI / 180;
    const log2 = location2.log * Math.PI / 180;
    const y = Math.sin(log2 - log1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(log2 - log1);
    const θ = Math.atan2(y, x);
    const brng = (θ * 180 / Math.PI + 360) % 360; // in degrees
    return brng;
}

(function() {
    const width = 300;
    const height = 300;

    const tagId = "#vis-radial";
    const svg = d3.select(tagId)
        .append("svg")
        .attr("width", width) // Sets the width of the svg
        .attr("height", height) // Sets the height of the svg
        .attr("viewBox", [0, 0, width, height]); // Sets the viewbox of the svg

    const center = {
        x: width / 2,
        y: height / 2,
    };

    const neuLocation = {
        lat: 42.338978,
        log: -71.087463,
    }

    d3.csv('https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_main_data.csv').then(data => {
        // Setting up path
        const path = d3.path();
        const maxDist = d3.max(data, d => {
            return distance(neuLocation, { lat: d['latitude'], log: d['longitude'] })
        })
        data.forEach(d => {
            path.moveTo(center.x, center.y);
            const barLocation = {
                lat: d['latitude'],
                log: d['longitude'],
            };
            const dist = distance(neuLocation, barLocation) / maxDist;
            const bear = bearing(neuLocation, barLocation);
            const x = dist * center.x * Math.cos(bear) + center.x;
            const y = dist * center.y * Math.sin(bear) + center.y;
            path.lineTo(x, y);
            svg
                .append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 2)
                .style('fill', 'blue')
        });

        svg
            .append('path')
            .attr('stroke', 'black')
            .attr('opacity', 0.3)
            .attr('d', path);

        svg
            .append('circle')
            .attr('cx', center.x)
            .attr('cy', center.y)
            .attr('r', 5)
            .style('fill', 'orange');
    });
})();