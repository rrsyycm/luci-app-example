#!/usr/bin/env ucode

'use strict';

import { cursor } from 'uci';

// Rather than parse files in /etc/config, we can use `cursor`.
const uci = cursor();

const methods = {
    get_status: {
		call: function() {
			const result = {
				running: true,
			};

			return result;
		}
	},
	get_sample1: {
		call: function() {
			const num_cats = uci.get('pool', 'animals', 'num_cats');
			const num_dogs = uci.get('pool', 'animals', 'num_dogs');
			const num_parakeets = uci.get('pool', 'animals', 'num_parakeets');
			const result = {
				num_cats,
				num_dogs,
				num_parakeets,
				is_this_real: false,
				not_found: null,
			};

			uci.unload();
			return result;
		}
	},

	get_sample2: {
		call: function() {
			const result = {
				option_one: {
					name: "Some string value",
					value: "A value string",
					parakeets: ["one", "99999", "three"],
				},
				option_two: {
					name: "Another string value",
					value: "And another value",
					parakeets: [3, 4, 5],
				},
			};
			return result;
		}
	},

	get_host: {
        call: function() {
            return {name: 'windows'};
        }
    },
    restart_service: {
        call: function() {
            let code = os.exec('killall sing-box');
            return { code: code };
        }
    }
};

return { 'luci.pool': methods };
