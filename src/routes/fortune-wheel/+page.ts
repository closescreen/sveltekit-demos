import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
    // if (!params.wheel_id) {
    //     error(404, 'Not found');
    // }

    // return { wheel_id: params.wheel_id }
    return {}
};