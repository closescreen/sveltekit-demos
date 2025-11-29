import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
    if (!params.variant_id) {
        error(404, 'Not found');
    }

    return { variant_id: params.variant_id, sortby: url.searchParams.get('sortby') }
};