import React from 'react';
import Image from 'next/image';
import { 
  Sprout, 
  Target, 
  Activity, 
  Image as ImageIcon, 
  Droplets,
  Truck,
  CheckCircle2
} from 'lucide-react';

// 1. Define TypeScript interfaces for our data structure
interface ManagementComponent {
  id: string;
  title: string;
  category: string;
  description: string;
  objectives: string[];
  ongoingActivities: string[];
  imageUrl: string; 
}

// 2. Mock Data for the Agricultural Management Segments
const managementComponents: ManagementComponent[] = [
  {
    id: 'crop-cultivation',
    title: 'Crop Cultivation & Agronomy',
    category: 'Agronomy & Soil Health',
    description: 'Managing soil health, advanced crop selection, and rotational planting schedules to maximize seasonal yield and crop resilience.',
    objectives: [
      'Increase crop yield by 12% using organic bio-fertilizers.',
      'Implement multi-crop rotation schedules across Sector Alpha.',
      'Achieve optimal soil pH levels across all planting fields.'
    ],
    ongoingActivities: [
      'Testing soil nutrient deficiencies in the northern quadrant.',
      'Sowing drought-resistant maize variants.',
      'Applying organic pest control treatments to soybean fields.'
    ],
    imageUrl: '/images (1).jpeg',
  },
  {
    id: 'irrigation-tech',
    title: 'Smart Irrigation & Water Management',
    category: 'Infrastructure & Telemetry',
    description: 'Deploying automated drip systems and real-time moisture monitoring to optimize water conservation and root absorption.',
    objectives: [
      'Reduce water wastage by 25% via smart sensor deployment.',
      'Maintain stable hydration profiles throughout the dry season.',
      'Ensure zero runoff pooling in low-lying zones.'
    ],
    ongoingActivities: [
      'Calibrating automated drip-irrigation schedules.',
      'Replacing faulty water pressure gauges in Sector Beta.',
      'Analyzing real-time soil moisture telemetry data.'
    ],
    imageUrl: '/images (4).jpeg',
  },
  {
    id: 'harvest-logistics',
    title: 'Supply Chain & Harvest Logistics',
    category: 'Distribution & Trade',
    description: 'Coordinating efficient post-harvest processing, cold storage stability, and distribution timelines to local marketplaces.',
    objectives: [
      'Keep post-harvest transit loss below a strict 3% threshold.',
      'Optimize temperature metrics in cold storage units.',
      'Secure supply agreements with regional wholesale vendors.'
    ],
    ongoingActivities: [
      'Packing harvested produce into temperature-controlled crates.',
      'Dispatching regional logistics trucks for supermarket delivery.',
      'Reviewing weight and quality metrics at the distribution hub.'
    ],
    imageUrl: '/images (7).jpeg',
  }
];

// 3. Main Component
export default function FarmManagementPage() {
  return (
    <main className="min-h-screen bg-slate-50/60 text-slate-700 font-sans">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-slate-800 pt-24 pb-20 relative overflow-hidden shadow-[inset_0_2px_20px_rgba(255,255,255,0.05)]">
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0f172a]">
          <Image 
            src="/smartirrigation.jpg" 
            alt="Farm Operations Background" 
            fill
            priority
            className="object-cover opacity-25 scale-105 contrast-110 brightness-90" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0f172a]/95 via-[#0f172a]/80 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/40 via-[#0f172a]/80 to-[#0f172a] pointer-events-none" />
        </div>

        {/* Glow & Accent Layers */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 pointer-events-none transform -skew-y-12 origin-top-left scale-150 mix-blend-overlay z-10" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[600px] bg-[#16a34a]/20 rounded-full blur-[120px] pointer-events-none z-10" />

        <div className="container mx-auto px-6 text-center relative z-20">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-extrabold bg-[#16a34a]/20 text-emerald-300 border border-[#16a34a]/40 backdrop-blur-md shadow-sm mb-4 tracking-wider uppercase">
            Operations Dashboard
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto drop-shadow-md">
            Agricultural Operations & Execution
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mt-4 leading-relaxed font-medium">
            Monitor cultivation metrics, track real-time resource allocations, and review sustainable farming goals backed by empirical field data.
          </p>
        </div>
      </section>

      {/* Segments Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="space-y-16">
          {managementComponents.map((component, index) => {
            const isEven = index % 2 === 0;
            
            // Map specific icons to their corresponding modules dynamically
            const getSectionIcon = (id: string) => {
              if (id === 'crop-cultivation') return <Sprout className="text-[#16a34a] w-7 h-7" />;
              if (id === 'irrigation-tech') return <Droplets className="text-sky-600 w-7 h-7" />;
              return <Truck className="text-amber-600 w-7 h-7" />;
            };

            return (
              <section 
                key={component.id}
                id={component.id} 
                className={`flex flex-col gap-10 items-center lg:flex-row p-6 md:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 ${
                  isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Text Content */}
                <div className="flex-1 space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a] bg-[#16a34a]/10 px-3 py-1 rounded-full">
                      {component.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-3 flex items-center gap-3">
                      {getSectionIcon(component.id)}
                      {component.title}
                    </h2>
                  </div>
                  
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {component.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Objectives */}
                    <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                      <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 mb-3 uppercase tracking-wider">
                        <Target className="w-4 h-4 text-[#16a34a]" />
                        Key Objectives
                      </h3>
                      <ul className="space-y-2 text-slate-600 text-xs sm:text-sm">
                        {component.objectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ongoing Activities */}
                    <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                      <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 mb-3 uppercase tracking-wider">
                        <Activity className="w-4 h-4 text-[#16a34a]" />
                        Live Field Activities
                      </h3>
                      <ul className="space-y-2 text-slate-600 text-xs sm:text-sm">
                        {component.ongoingActivities.map((act, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0 mt-2" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Picture Section */}
                <div className="flex-1 w-full">
                  <div className="relative h-72 md:h-96 w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 group bg-slate-100">
                    <Image 
                      src={component.imageUrl}
                      alt={component.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={index === 0} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Picture Tag */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#0f172a] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm border border-slate-200/50">
                      <ImageIcon className="w-3.5 h-3.5 text-[#16a34a]" />
                      Live Field Camera Feed
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}