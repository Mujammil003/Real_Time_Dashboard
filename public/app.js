document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const graphsContainer = document.getElementById('graphs-container');
    const suggestedTypeElement = document.getElementById('suggestedType');
    const selectButton = document.querySelector('button');
    // Socket event for updating data
    socket.on('updateData', (data) => {
        const currentTime = new Date().toLocaleTimeString();
        const graphContainer = document.getElementById(`graph-${data.suggestedGraphType}`);

        if (graphContainer) {
            updateGraph(graphContainer, data.suggestedGraphType, currentTime, data.newData);
        }
    });

    // Socket event for changing graph type
    socket.on('graphTypesChange', (graphTypes) => {
        // Initialize the graphs based on the suggested graph types
        graphTypes.forEach((graphType) => {
            createGraph(graphType);
        });

        // Determine the best graph type
        const bestGraphType = determineBestGraph(graphTypes);
        suggestedTypeElement.textContent = `Suggested Graph Type: ${bestGraphType}`;
        selectButton.dataset.graphType = bestGraphType;
    });

    // Function to select the suggested graph
    window.selectSuggestedGraph = function () {
        const graphType = selectButton.dataset.graphType;
        if (graphType) {
            window.changeGraphType(graphType);
        } else {
            console.error('No suggested graph type available.');
        }
    };

    // Function to change graph type dynamically
    window.changeGraphType = function (graphType) {
        socket.emit('changeGraphType', graphType);
    };

    // Helper function to create a graph based on type
    function createGraph(graphType) {
        const currentTime = new Date().toLocaleTimeString();
        const graphContainer = document.createElement('div');
        graphContainer.id = `graph-${graphType}`;
        graphContainer.classList.add('graph-container');

        const layout = {
            title: `Real-time ${graphType.charAt(0).toUpperCase() + graphType.slice(1)} Data`,
            xaxis: {
                title: 'Time',
            },
            yaxis: {
                title: 'Value',
            },
        };

        const trace = {
            x: [currentTime],
            y: (graphType === 'horizontal' || graphType === 'vertical') ? [0, 0] : [0],
            type: graphType
        };
        const data = [trace];

        const plotlyConfig = {
            displayModeBar: true,
            responsive: true,
        };

        const newGraph = Plotly.newPlot(graphContainer, data, layout, plotlyConfig);
        graphsContainer.appendChild(graphContainer);

        if (graphType !== 'line' && graphType !== 'bar') {
            // For scatter, horizontal, and vertical graphs, update the traces dynamically
            setInterval(() => {
                const newData = Math.floor(Math.random() * 100);
                updateGraph(graphContainer, graphType, currentTime, newData);
            }, 2000);
        }
    }

    // Helper function to update graph data
    function updateGraph(graphContainer, graphType, currentTime, newData) {
        if (graphType === 'scatter') {
            Plotly.extendTraces(graphContainer, { x: [[currentTime]], y: [[newData]] }, [0]);
        } else if (graphType === 'horizontal') {
            Plotly.extendTraces(graphContainer, { x: [[newData, newData]], y: [[currentTime, currentTime]] }, [0]);
        } else if (graphType === 'vertical') {
            Plotly.extendTraces(graphContainer, { x: [[currentTime]], y: [[newData, newData]] }, [0]);
        } else if (graphType === 'line' || graphType === 'bar') {
            Plotly.extendTraces(graphContainer, { x: [[currentTime]], y: [[newData]] }, [0]);
        }
    }

    // Function to determine the best graph type based on given criteria
    function determineBestGraph(graphTypes) {
        // Initialize variables to track evaluation scores for each graph type
        let scatterScore = 0;
        let horizontalScore = 0;
        let verticalScore = 0;
        let lineScore = 0;
        let barScore = 0;

        // Criteria evaluation

        // Data Distribution
        // Evaluate how well each graph type represents the data distribution
        const distinctValues = new Set(graphTypes);
        const distinctValueCount = distinctValues.size;
        // Higher distinct value count might indicate scatter plot suitability
        scatterScore += distinctValueCount;

        // Data Variability
        // Evaluate how well each graph type represents data variability
        const standardDeviation = calculateStandardDeviation(graphTypes);
        // Higher standard deviation might indicate scatter plot suitability
        scatterScore += standardDeviation;

        // Ease of Interpretation
        // Evaluate the ease of interpretation for each graph type
        scatterScore += 5;
        lineScore += 3;
        barScore += 4;
        horizontalScore += 3;
        verticalScore += 4;

        // Visual Appeal
        // Evaluate the visual appeal of each graph type
        barScore += 5;
        scatterScore += 4;
        horizontalScore += 3;
        verticalScore += 4;
        lineScore += 3;

        // Determine the maximum score among the graph types
        const maxScore = Math.max(scatterScore, horizontalScore, verticalScore, lineScore, barScore);

        // Return the graph type with the maximum score
        if (maxScore === scatterScore) {
            return 'scatter';
        } else if (maxScore === horizontalScore) {
            return 'horizontal';
        } else if (maxScore === verticalScore) {
            return 'vertical';
        } else if (maxScore === lineScore) {
            return 'line';
        } else {
            return 'bar';
        }
    }

    // Example function to calculate standard deviation
    function calculateStandardDeviation(data) {
        const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
        const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
        const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / data.length;
        return Math.sqrt(variance);
    }
});
