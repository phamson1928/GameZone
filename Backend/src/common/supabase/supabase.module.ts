import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Module({
    providers: [
        {
            provide: 'SUPABASE_CLIENT',
            useFactory: (configService: ConfigService) => {
                const url = configService.get<string>('SUPABASE_URL');
                const key = configService.get<string>('SUPABASE_ANON_KEY');
                if (!url || !key) {
                    throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is missing');
                }
                return createClient(url, key);
            },
            inject: [ConfigService],
        },
    ],
    exports: ['SUPABASE_CLIENT'],
})
export class SupabaseModule { }
