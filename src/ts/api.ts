import axios from 'axios';
import * as DPlayerType from '../types/DPlayer';

const defaultApiBackend: DPlayerType.APIBackend = {
    send: (options) => {
        if (options.url === undefined) {
            options.error && options.error();
            return;
        }
        axios
            .post(options.url, options.data)
            .then((response) => {
                const data = response.data;
                if (!data || data.code !== 0) {
                    options.error && options.error(data && data.msg);
                    return;
                }
                options.success && options.success();
            })
            .catch((e) => {
                console.error(e);
                options.error && options.error();
            });
    },

    read: (options) => {
        if (options.url === undefined) {
            options.error && options.error();
            return;
        }
        axios
            .get(options.url)
            .then((response) => {
                const data = response.data;
                if (!data || data.code !== 0) {
                    options.error && options.error(data && data.msg);
                    return;
                }
                if (data.data) {
                    options.success &&
                        options.success((data.data as any[][]).map((item) => ({
                            author: item[3],
                            time: item[0],
                            text: item[4],
                            color: item[2],
                            type: item[1],
                            size: (item[5] ? (((item[5] === 'big') || (item[5] === 'small')) ? item[5] : 'medium') : 'medium'),
                        })));
                } else {
                    options.success &&
                        options.success([{
                            author: '',
                            time: 0,
                            text: '',
                            color: '#ffeaea',
                            type: 'right',
                            size: 'medium',
                        }]);
                }
            })
            .catch((e) => {
                console.error(e);
                options.error && options.error();
            });
    },
};
export default defaultApiBackend;
