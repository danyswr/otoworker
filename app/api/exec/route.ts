import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    
    if (!command) {
      return NextResponse.json({ ok: false, error: "No command provided" }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(command);
    return NextResponse.json({ ok: true, stdout, stderr });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message, stdout: error.stdout, stderr: error.stderr }, { status: 500 });
  }
}
