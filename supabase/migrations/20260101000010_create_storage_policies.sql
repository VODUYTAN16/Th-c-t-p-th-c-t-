INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
    ('cvs', 'cvs', false, 10485760),
    ('job-descriptions', 'job-descriptions', false, 5242880),
    ('audio-recordings', 'audio-recordings', false, 52428800),
    ('reports', 'reports', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- CVs bucket
CREATE POLICY "Users upload own CVs" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own CVs" ON storage.objects FOR SELECT
    USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own CVs" ON storage.objects FOR DELETE
    USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Job descriptions bucket
CREATE POLICY "Users upload own JDs" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'job-descriptions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own JDs" ON storage.objects FOR SELECT
    USING (bucket_id = 'job-descriptions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own JDs" ON storage.objects FOR DELETE
    USING (bucket_id = 'job-descriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Audio recordings bucket (session-based, user owns session folder)
CREATE POLICY "Users read own audio" ON storage.objects FOR SELECT
    USING (bucket_id = 'audio-recordings' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users upload own audio" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid() IS NOT NULL);

-- Reports bucket
CREATE POLICY "Users read own reports" ON storage.objects FOR SELECT
    USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
