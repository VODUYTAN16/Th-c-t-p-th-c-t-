# AI Interview Assistant (MVP)

Nền tảng luyện phỏng vấn việc làm bằng giọng nói với AI. Upload CV/JD → phỏng vấn voice → đánh giá 4 tiêu chí → báo cáo PDF.

## Stack

- **Frontend**: React + TypeScript + Tailwind + Vite
- **Backend**: FastAPI + LangGraph + Prisma
- **Database/Auth/Storage**: Supabase (PostgreSQL + pgvector)
- **AI**: Ollama (qwen2.5) + Gemini Flash fallback
- **Voice**: faster-whisper (STT) + edge-tts (TTS)

## Yêu cầu

- Node.js 18+
- Python 3.11+
- Tài khoản [Supabase](https://supabase.com) (free tier)
- (Tùy chọn) Docker cho Ollama local
- (Tùy chọn) GEMINI_API_KEY cho fallback cloud

## 1. Thiết lập Supabase

1. Tạo project mới trên Supabase Dashboard
2. Vào **SQL Editor**, chạy lần lượt các file trong `supabase/migrations/` (theo thứ tự 000000 → 000010)
3. Hoặc dùng Supabase CLI: `supabase link` rồi `supabase db push`
4. Lấy credentials từ **Settings → API**:
   - Project URL
   - anon key
   - service_role key
5. Lấy connection string từ **Settings → Database**:
   - Transaction pooler (port 6543) → `DATABASE_URL`
   - Direct connection (port 5432) → `DIRECT_DATABASE_URL`

## 2. Cấu hình môi trường

```bash
cp .env.example .env
# Điền các giá trị Supabase, Gemini, Ollama
```

Copy các biến `VITE_*` sang `frontend/.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://localhost:8000
```

## 3. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> **Lưu ý DB**: Backend dùng Supabase PostgREST (service role) qua `db_service.py`. File `prisma/schema.prisma` là schema tham chiếu; chạy migrations SQL trên Supabase Dashboard là bắt buộc.

```bash
# Tùy chọn: generate Prisma client (cần PATH chứa .venv/Scripts)
prisma generate
```

## 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Truy cập: http://localhost:5173

## 5. Ollama (tùy chọn, local LLM)

```bash
docker compose up -d
docker exec -it <ollama_container> ollama pull qwen2.5:7b
```

## Luồng sử dụng

1. **Đăng ký / Đăng nhập** (Supabase Auth)
2. **Upload CV** (+ JD tùy chọn), nhập vị trí ứng tuyển
3. Hệ thống phân tích CV và tạo 10–15 câu hỏi
4. **Phỏng vấn giọng nói** — AI hỏi, bạn trả lời qua microphone
5. **Báo cáo** — điểm 4 tiêu chí, gợi ý cải thiện CV, tải PDF

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/documents/upload` | Upload CV/JD |
| POST | `/sessions` | Tạo phiên + parse + generate questions |
| GET | `/sessions` | Lịch sử |
| GET | `/sessions/{id}` | Chi tiết phiên |
| WS | `/ws/interview/{id}?token=...` | Voice interview |
| POST | `/sessions/{id}/complete` | Kích hoạt đánh giá |
| GET | `/sessions/{id}/report` | Báo cáo JSON |
| GET | `/sessions/{id}/report/pdf` | Tải PDF |

## Cấu trúc thư mục

```
├── frontend/          # React app
├── backend/           # FastAPI + agents
├── supabase/          # SQL migrations + RLS
├── docker-compose.yml # Ollama optional
└── .env.example
```

## Kiểm tra thủ công (E2E)

- [ ] Đăng ký tài khoản mới, profile tự tạo trong Supabase
- [ ] Upload CV PDF, status chuyển parsing → ready
- [ ] Có ≥10 câu hỏi trong bảng `questions`
- [ ] WebSocket phỏng vấn: nghe TTS, ghi âm, thấy transcript
- [ ] Hoàn thành → báo cáo có điểm 4 tiêu chí
- [ ] Tải PDF từ Storage bucket `reports`
- [ ] User A không thấy dữ liệu của User B (RLS)

## Xử lý sự cố

| Vấn đề | Giải pháp |
|--------|-----------|
| LLM timeout | Kiểm tra Ollama hoặc thêm `GEMINI_API_KEY` |
| Whisper chậm | Đặt `WHISPER_DEVICE=cpu`, model `small` |
| Mic không hoạt động | Cấp quyền microphone trên browser (HTTPS/localhost) |
| Prisma lỗi kết nối | Dùng pooler URL (6543) cho runtime, direct (5432) cho migrate |
