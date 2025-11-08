// app/definite-test/page.tsx
'use client';
import './styles-test/styles.css';
export default function DefiniteTest() {
  return (
    <div data-theme="corporate" className="min-h-screen p-8 bg-base-200">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">Definite Test</h1>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Test 1: Regular Tailwind */}
        <div className="p-4 bg-blue-500 text-white rounded-lg">
          <h2 className="text-xl font-bold">Regular Tailwind (should be blue)</h2>
          <p>If this is blue, Tailwind is working</p>
        </div>

        {/* Test 2: DaisyUI components */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title" >DaisyUI Card</h2>
            <p>If this looks styled, DaisyUI is working</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Primary Button</button>
              <button className="btn btn-secondary">Secondary Button</button>
              <button className="btn btn-accent">Accent Button</button>
            </div>
          </div>
        </div>

        {/* Test 3: More DaisyUI components */}
        <div className="flex gap-4 flex-wrap">
          <div className="badge badge-primary">Primary</div>
          <div className="badge badge-secondary">Secondary</div>
          <div className="badge badge-accent">Accent</div>
          <div className="badge badge-ghost">Ghost</div>
        </div>

        {/* Test 4: Alert */}
        <div className="alert alert-success">
          <span>Success alert!</span>
        </div>

        {/* Test 5: Stats */}
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Page Views</div>
            <div className="stat-value">89,400</div>
            <div className="stat-desc">21% more than last month</div>
          </div>
        </div>
      </div>
    </div>
  );
}