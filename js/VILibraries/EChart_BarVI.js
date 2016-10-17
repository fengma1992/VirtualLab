/**
 * Created by Fengma on 2016/10/11.
 */

function BarVI(domElement) {
    var _this = this;
    // 初始化echarts图表
    this.myChart = echarts.init(domElement);

    this.option = {
        title: {
            text: '',
            x: 'center'
        },
        legend: {
            data: [''],
            x: 10
        },
        toolbox: {
            // y: 'bottom',
            feature: {
                // magicType: {
                //     type: ['stack', 'tiled']
                // },
                // dataView: {},
                saveAsImage: {
                    pixelRatio: 2
                }
            }
        },
        tooltip: {
            show:true,
            formatter: '{b}:{c}'
        },
        xAxis: {
            data: [],
            silent: false,
            splitLine: {
                show: false
            }
        },
        yAxis: {},
        series: [{
            name: '',
            type: 'bar',
            // data: _this.data,
        }],
        animation:false,
    };

    // 为echarts对象加载数据
    this.myChart.setOption(_this.option);

    /**
     *
     * @param data 当前需要显示的数据
     */
    this.setData = function (data) {
        var temp = [];
        for (var i = 0; i < data.length; i++) {
            temp.push(i);
        }
        _this.option.xAxis.data = temp;
        _this.option.series[0].data = data;
        _this.myChart.setOption(_this.option, true);
    };

    this.setYAxis = function (yMin, yMax) {
        _this.option.yAxis.min = yMin;
        _this.option.yAxis.max = yMax;
        _this.myChart.setOption(_this.option, true);
    };

    this.setXAxis = function (xAxis) {
        _this.option.xAxis.data = xAxis;
        _this.myChart.setOption(_this.option, true);
    }
}