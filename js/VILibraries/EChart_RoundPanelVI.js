/**
 * Created by Fengma on 2016/10/9.
 */

/**
 *  速度、温度等仪表盘
 * @param name  仪表盘显示内容
 * @param min   仪表盘最小值
 * @param max   仪表盘最大值
 * @param unit  显示内容单位
 * @param domElement    div容器
 * @constructor EChart.js
 */
function RoundPanelVI(domElement, name, min, max, unit) {
    var _this = this;
    // 初始化echarts图表
    this.myChart = echarts.init(domElement);
    this.option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}"
        },
        toolbox: {
            show: true,
            feature: {
                mark: {show: true},
                restore: {show: true},
                saveAsImage: {show: true}
            }
        },
        series: [
            {
                name: name,
                type: 'gauge',
                min: min,
                max: max,
                splitNumber: 10,       // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, '#228b22'], [0.8, '#48b'], [1, '#ff4500']],
                        width: 8
                    }
                },
                axisTick: {            // 坐标轴小标记
                    splitNumber: 10,   // 每份split细分多少段
                    length: 12,        // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: 'auto'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'auto'
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length: 30,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: 'auto'
                    }
                },
                pointer: {
                    width: 5
                },
                title: {
                    show: true,
                    offsetCenter: [0, '-40%'],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        fontWeight: 'bolder'
                    }
                },
                detail: {
                    formatter: '{value}',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'auto',
                        fontWeight: 'bolder'
                    }
                },
                data: [{value: min, name: unit}]
            }
        ]
    };

    // 为echarts对象加载数据
    _this.myChart.setOption(_this.option);

    /**
     *
     * @param data 当前需要显示的数据
     */
    this.setData = function (data) {
        _this.option.series[0].data[0].value = data;
        _this.myChart.setOption(_this.option, true);
    }
}