-- Remover políticas antigas que exigem auth
DROP POLICY IF EXISTS "Users can view their own tools" ON public.assistant_tools;
DROP POLICY IF EXISTS "Users can create their own tools" ON public.assistant_tools;
DROP POLICY IF EXISTS "Users can update their own tools" ON public.assistant_tools;
DROP POLICY IF EXISTS "Users can delete their own tools" ON public.assistant_tools;

DROP POLICY IF EXISTS "Users can view assets of their tools" ON public.tool_assets;
DROP POLICY IF EXISTS "Users can create assets for their tools" ON public.tool_assets;
DROP POLICY IF EXISTS "Users can update assets of their tools" ON public.tool_assets;
DROP POLICY IF EXISTS "Users can delete assets of their tools" ON public.tool_assets;

-- Criar políticas públicas para demo (sem auth)
CREATE POLICY "Public can view all tools"
ON public.assistant_tools
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can create tools"
ON public.assistant_tools
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update tools"
ON public.assistant_tools
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete tools"
ON public.assistant_tools
FOR DELETE
TO anon, authenticated
USING (true);

-- Políticas para tool_assets
CREATE POLICY "Public can view all assets"
ON public.tool_assets
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can create assets"
ON public.tool_assets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update assets"
ON public.tool_assets
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete assets"
ON public.tool_assets
FOR DELETE
TO anon, authenticated
USING (true);

-- Atualizar storage policies para acesso público
DROP POLICY IF EXISTS "Authenticated users can upload tool assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own tool assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own tool assets" ON storage.objects;

CREATE POLICY "Anyone can upload tool assets"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'tool-assets');

CREATE POLICY "Anyone can update tool assets"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'tool-assets');

CREATE POLICY "Anyone can delete tool assets"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'tool-assets');