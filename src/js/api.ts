import axios from 'axios';

export default {
    send: (options: any) => {
        axios
            .post(options.url, options.data)
            .then((response) => {
                const data = response.data;
                if (!data || data.code !== 0) {
                    options.error && options.error(data && data.msg);
                    return;
                }
                options.success && options.success(data);
            })
            .catch((e) => {
                console.error(e);
                options.error && options.error();
            });
    },

    read: (options: any) => {
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
                        options.success(
                            data.data.map((item: any) => ({
                                time: item[0],
                                type: item[1],
                                color: item[2],
                                author: item[3],
                                text: item[4],
                                size: (item[5] ? (((item[5] === 'big') || (item[5] === 'small')) ? item[5] : 'medium') : 'medium')
                            }))
                        );
                } else {
                    options.success &&
                        options.success({
                            time: 0,
                            type: 0,
                            color: '#ffeaea',
                            author: '',
                            text: '',
                            size: 'medium',
                        });
                }
            })
            .catch((e) => {
                console.error(e);
                options.error && options.error();
            });
    },
};
