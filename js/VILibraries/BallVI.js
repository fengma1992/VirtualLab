/**
 * Created by Fengma on 2016/10/19.
 */

function BallVI(domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.Fs = 50;
    this.angle = 0;
    this.position = 0;
    this.limit = true;
    this.u1 = 0;
    this.u2 = 0;
    this.y1 = 0;
    this.y2 = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.autoSave = true;
    this.angelOutput = [];
    this.positionOutput = [];

    /**
     *
     * @param angle 输入端口读取角度
     */
    this.setInputAngle = function (angle) {

        var u, v, Ts = 1 / _this.Fs, angleMax = 100 * Ts;
        u = angle;
        if (_this.limit) {
            if ((u - _this.angle) > angleMax)
                u = _this.angle + angleMax;
            if ((_this.angle - u) > angleMax)
                u = _this.angle - angleMax;
            if (u > 30)
                u = 30;
            if (u < -30)
                u = -30;
        }

        _this.angle = u;//向输出端口上写数据
        v = _this.y1 + 0.5 * Ts * (u + _this.u1);
        _this.u1 = u;
        _this.y1 = v;
        u = v;
        v = _this.y2 + 0.5 * Ts * (u + _this.u2);
        _this.u2 = u;
        _this.y2 = v;
        if (v > 40)
            v = 40;
        if (v < -40)
            v = -40;
        _this.position = v;//向输出端口上写数据

        if (_this.autoSave)
            _this.dataCollector(_this.angle, _this.position);

        return [_this.angle, _this.position];
    };

    /**
     * 将输出数保存在数组内
     * @param angel 输出角度
     * @param position 输出位置
     */
    this.dataCollector = function (angel, position) {

        var i = 0;
        if (_this.index == 0) {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.angelOutput[i] = 0;
                _this.positionOutput[i] = 0;
            }
        }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.angelOutput[_this.index] = angel;
            _this.positionOutput[_this.index] = position;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.angelOutput[i] = _this.angelOutput[i + 1];
                _this.positionOutput[i] = _this.positionOutput[i + 1];
            }
            _this.angelOutput[_this.dataLength - 1] = angel;
            _this.positionOutput[_this.dataLength - 1] = position;
        }
    };

    this.reset = function () {

        _this.angle = 0;
        _this.position = 0;
        _this.limit = true;
        _this.u1 = 0;
        _this.u2 = 0;
        _this.y1 = 0;
        _this.y2 = 0;
        _this.index = 0;
    }

}