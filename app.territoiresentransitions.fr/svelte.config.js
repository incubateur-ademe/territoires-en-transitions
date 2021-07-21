import preprocess from 'svelte-preprocess'
import ssr from '@sveltejs/adapter-static'
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
export default {
    preprocess: [
        preprocess({
            defaults: {
                style: 'postcss'
            },
            postcss: true
        })
    ],

    kit: {
        adapter: ssr(),
        target: '#svelte',
        vite: {
            mode: process.env.MODE || 'dev',
            resolve: {
                alias: {
                    $api: path.resolve('./src/api'),
                    $components: path.resolve('./src/components'),
                    $generated: path.resolve('./src/generated'),
                    $storables: path.resolve('./src/storables'),
                    $utils: path.resolve('./src/utils'),
                }
            }
        }
    }
}


