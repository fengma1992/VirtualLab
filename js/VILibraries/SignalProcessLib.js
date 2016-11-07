/**
 * Created by Fengma on 2016/11/3.
 */

/**
 * FFT算法
 * @param dir
 * @param m 采样点数，多余输入数据时剩余部分置0
 * @param realPart
 * @param imgPart   对于实数据时留空
 * @returns {Array}
 */
function fft(dir, m, realPart, imgPart) {
    'use strict';
    //trace('Getting FFT');
    var n, i, i1, j, k, i2, l, l1, l2, c1, c2, tx, ty, t1, t2, u1, u2, z;
    n = 1;
    for (i = 0; i < m; i++) {

        n *= 2;
    }

    if (imgPart == undefined) {
        imgPart = [];
        for (i = 0; i < n; i++) {
            imgPart.push(0);
        }
    }
    /* Do the bit reversal */
    i2 = n >> 1;
    j = 0;
    for (i = 0; i < n - 1; i++) {
        if (i < j) {
            tx = realPart[i];
            ty = imgPart[i];
            realPart[i] = realPart[j];
            imgPart[i] = imgPart[j];
            realPart[j] = tx;
            imgPart[j] = ty;
        }
        k = i2;
        while (k <= j) {
            j -= k;
            k >>= 1;
        }
        j += k;
    }
    /* Compute the FFT */
    c1 = -1.0;
    c2 = 0.0;
    l2 = 1;
    for (l = 0; l < m; l++) {
        l1 = l2;
        l2 <<= 1;
        u1 = 1.0;
        u2 = 0.0;
        for (j = 0; j < l1; j++) {
            for (i = j; i < n; i += l2) {
                i1 = i + l1;
                t1 = u1 * realPart[i1] - u2 * imgPart[i1];
                t2 = u1 * imgPart[i1] + u2 * realPart[i1];
                realPart[i1] = realPart[i] - t1;
                imgPart[i1] = imgPart[i] - t2;
                realPart[i] += t1;
                imgPart[i] += t2;
            }
            z = u1 * c1 - u2 * c2;
            u2 = u1 * c2 + u2 * c1;
            u1 = z;
        }
        c2 = Math.sqrt((1.0 - c1) * 0.5);
        if (dir == 1) {

            c2 = -c2;
        }
        c1 = Math.sqrt((1.0 + c1) * 0.5);
    }
    /* Scaling for forward transform */
    if (dir == 1) {
        for (i = 0; i < n; i++) {
            realPart[i] /= n;
            imgPart[i] /= n;
        }
    }

    var output = [];
    for (i = 0; i < n / 2; i++) {

        output[i] = 2 * Math.sqrt(realPart[i] * realPart[i] + imgPart[i] * imgPart[i]);
    }
    return output;
}