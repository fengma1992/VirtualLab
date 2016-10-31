/**
 * Created by Fengma on 2016/10/18.
 */

/**
 * PID控制器
 * @param domElement HTML CANVAS
 * @constructor
 */
function PIDVI(domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext('2d');
    this.name = 'PIDVI';
    this.cnText = 'PID';

    this.input = 0;
    this.singleOutput = 0;
    this.P = 1;
    this.I = 1;
    this.D = 1;
    this.Fs = 100;
    this.u1 = 0;
    this.y1 = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    /**
     *
     * @param input 从输入端读取的数据
     */
    this.setData = function (input) {

        _this.input = typeof input === 'object' ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v1, v2, v3, v21, u, Ts = 1.0 / _this.Fs;

        u = _this.input;//从输入端口上读数
        v1 = _this.P * u;
        v21 = _this.y1 + 0.5 * Ts * (u + _this.u1);
        _this.y1 = v21;
        v2 = _this.I * v21;
        v3 = _this.D * (u - _this.u1) / Ts;
        _this.u1 = u;
        _this.singleOutput = v1 + v2 + v3;//向输出端口上写数


        //将输出数保存在数组内
        var i = 0;
        if (_this.index == 0) {
            for (i = 0; i < _this.dataLength; i++) {
                _this.output[i] = 0;
            }
        }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;
    };


    this.reset = function () {

        _this.input = 0;
        _this.singleOutput = 0;
        _this.P = 1;
        _this.I = 1;
        _this.D = 1;
        _this.Fs = 100;
        _this.u1 = 0;
        _this.y1 = 0;
        _this.index = 0;
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('PID', _this.container.width / 2 - 11, _this.container.height / 2 + 6);
    };

    this.draw();
}