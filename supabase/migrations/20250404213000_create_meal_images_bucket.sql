-- Create storage bucket for meal images
insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', true);

-- Set up access policies for meal-images bucket
create policy "Allow public read access to meal images"
on storage.objects for select
using (bucket_id = 'meal-images');

create policy "Allow authenticated uploads to meal-images"
on storage.objects for insert
with check (
  bucket_id = 'meal-images'
  and auth.role() = 'authenticated'
);

create policy "Allow meal owners to update their images"
on storage.objects for update
using (
  bucket_id = 'meal-images'
  and auth.uid() = owner
);

create policy "Allow meal owners to delete their images"
on storage.objects for delete
using (
  bucket_id = 'meal-images'
  and auth.uid() = owner
);
