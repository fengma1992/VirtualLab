/**
 * Created by Fengma on 2016/10/25.
 */

/**
 * 直流输出
 * @param domElement
 * @constructor
 */
function DCOutputVI(domElement) {
    'use strict';
    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'DCOutputVI';
    this.cnText = '直流输出';
    this.runningFlag = false;

    this.dataLength = 1024;
    this.index = 0;
    this.singleOutput = 100;//输出初值
    this.output = [];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.target = [];

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    /**
     * 将输出数保存在数组内
     * @param data singleOutput
     */
    this.setData = function (data) {

        data = isArray(data) ? data[data.length - 1] : data;
        if (isNaN(data)) {

            return false;
        }

        _this.singleOutput = data;

        var i = 0;
        // if (_this.index == 0) {
        //
        //     for (i = 0; i < _this.dataLength; i++) {
        //
        //         _this.output[i] = 0;
        //     }
        // }
        if (_this.index <= (_this.dataLength - 1)) {

            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {

            for (i = 0; i < _this.dataLength - 1; i++) {

                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }
    };

    this.reset = function () {

        _this.index = 0;
        _this.output = [];
    };

    this.draw = function () {

        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('直流', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('输出', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();

}