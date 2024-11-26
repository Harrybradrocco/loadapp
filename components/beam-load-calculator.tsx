'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Plus, Minus } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import html2canvas from 'html2canvas'

const standardMaterials = {
  'ASTM A36 Structural Steel': {
    yieldStrength: 250,
    elasticModulus: 200,
    density: 7850,
    poissonsRatio: 0.3,
    thermalExpansion: 12,
  },
  'ASTM A992 Structural Steel': {
    yieldStrength: 345,
    elasticModulus: 200,
    density: 7850,
    poissonsRatio: 0.3,
    thermalExpansion: 12,
  },
  'ASTM A572 Grade 50 Steel': {
    yieldStrength: 345,
    elasticModulus: 200,
    density: 7850,
    poissonsRatio: 0.3,
    thermalExpansion: 12,
  },
  'Custom': {
    yieldStrength: 0,
    elasticModulus: 0,
    density: 0,
    poissonsRatio: 0,
    thermalExpansion: 0,
  },
} as const;

interface Load {
  type: 'Point Load' | 'Uniform Load';
  magnitude: number;
  startPosition: number;
  endPosition?: number;
}

interface BeamDiagramProps {
  beamLength: number;
  leftSupport: number;
  rightSupport: number;
  loads: Load[];
}

interface CustomMaterial {
  yieldStrength: number;
  elasticModulus: number;
  density: number;  // Add any other required properties here
}
const BeamDiagram: React.FC<BeamDiagramProps> = ({ 
  beamLength, 
  leftSupport, 
  rightSupport, 
  loads
}) => {
  const svgWidth = 500
  const svgHeight = 200
  const margin = 40
  const beamY = svgHeight / 2
  const supportSize = 30

  const leftSupportX = margin + (leftSupport / beamLength) * (svgWidth - 2 * margin)
  const rightSupportX = margin + (rightSupport / beamLength) * (svgWidth - 2 * margin)

  return (
    <svg 
      width={svgWidth} 
      height={svgHeight} 
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="mx-auto"
      style={{ 
        display: 'block',
        backgroundColor: 'white',
      }}
    >
      {/* Beam */}
      <line
        x1={margin}
        y1={beamY}
        x2={svgWidth - margin}
        y2={beamY}
        stroke="black"
        strokeWidth="4"
      />

      {/* Left Support */}
      <polygon
        points={`${leftSupportX},${beamY} ${leftSupportX - supportSize / 2},${
          beamY + supportSize
        } ${leftSupportX + supportSize / 2},${beamY + supportSize}`}
        fill="none"
        stroke="black"
        strokeWidth="2"
      />

      {/* Right Support */}
      <polygon
        points={`${rightSupportX},${beamY} ${rightSupportX - supportSize / 2},${
          beamY + supportSize
        } ${rightSupportX + supportSize / 2},${beamY + supportSize}`}
        fill="none"
        stroke="black"
        strokeWidth="2"
      />

      {/* Load Arrows */}
      {loads.map((load, index) => {
        const loadStartX = margin + (load.startPosition / beamLength) * (svgWidth - 2 * margin)
        const loadEndX = load.type === 'Uniform Load' 
          ? margin + (load.endPosition! / beamLength) * (svgWidth - 2 * margin)
          : loadStartX

        if (load.type === 'Point Load') {
          return (
            <line
              key={index}
              x1={loadStartX}
              y1={beamY - 60}
              x2={loadStartX}
              y2={beamY}
              stroke="red"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          )
        } else {
          return (
            <g key={index}>
              <line
                x1={loadStartX}
                y1={beamY - 40}
                x2={loadEndX}
                y2={beamY - 40}
                stroke="red"
                strokeWidth="2"
              />
              {Array.from({ length: 5 }).map((_, i) => {
                const x = loadStartX + ((loadEndX - loadStartX) / 4) * i
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={beamY - 40}
                    x2={x}
                    y2={beamY}
                    stroke="red"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )
              })}
            </g>
          )
        }
      })}

      {/* Arrow definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="red" />
        </marker>
      </defs>

      {/* Labels */}
      <text x={margin} y={beamY + supportSize + 20} textAnchor="middle" fontSize="12">
        0
      </text>
      <text x={svgWidth - margin} y={beamY + supportSize + 20} textAnchor="middle" fontSize="12">
        {beamLength}
      </text>
      {loads.map((load, index) => {
        const loadX = margin + (load.startPosition / beamLength) * (svgWidth - 2 * margin)
        return (
          <text key={index} x={loadX} y={beamY - 70} textAnchor="middle" fontSize="12" fill="red">
            {load.magnitude.toFixed(2)} N
          </text>
        )
      })}
      <text x={svgWidth / 2} y={svgHeight - 10} textAnchor="middle" fontSize="12">
        Beam Length: {beamLength} mm
      </text>
    </svg>
  )
}

const BeamCrossSectionImage: React.FC<{ type: string }> = ({ type }) => {
  const size = 150;
  const strokeWidth = 2;

  switch (type) {
    case 'Rectangular':
      return (
        <svg width={size} height={size} viewBox="0 0 150 150">
          <rect x="25" y="25" width="100" height="100" fill="none" stroke="black" strokeWidth={strokeWidth} />
          <line x1="0" y1="25" x2="25" y2="25" stroke="black" strokeWidth="1" />
          <line x1="0" y1="125" x2="25" y2="125" stroke="black" strokeWidth="1" />
          <text x="10" y="80" fontSize="12" textAnchor="middle">H</text>
          <line x1="25" y1="0" x2="25" y2="25" stroke="black" strokeWidth="1" />
          <line x1="125" y1="0" x2="125" y2="25" stroke="black" strokeWidth="1" />
          <text x="75" y="15" fontSize="12" textAnchor="middle">W</text>
        </svg>
      );
    case 'I Beam':
      return (
        <svg width={size} height={size} viewBox="0 0 150 150">
          <path d="M25 25 H125 V45 H95 V105 H125 V125 H25 V105 H55 V45 H25 Z" fill="none" stroke="black" strokeWidth={strokeWidth} />
          <line x1="0" y1="25" x2="25" y2="25" stroke="black" strokeWidth="1" />
          <line x1="0" y1="125" x2="25" y2="125" stroke="black" strokeWidth="1" />
          <text x="10" y="80" fontSize="12" textAnchor="middle">H</text>
          <line x1="125" y1="25" x2="150" y2="25" stroke="black" strokeWidth="1" />
          <text x="137" y="40" fontSize="12" textAnchor="middle">tf</text>
          <line x1="95" y1="45" x2="125" y2="45" stroke="black" strokeWidth="1" />
          <text x="110" y="55" fontSize="12" textAnchor="middle">tw</text>
          <line x1="125" y1="0" x2="125" y2="25" stroke="black" strokeWidth="1" />
          <text x="135" y="15" fontSize="12" textAnchor="middle">bf</text>
        </svg>
      );
    case 'C Channel':
      return (
        <svg width={size} height={size} viewBox="0 0 150 150">
          <path d="M50 25 H125 V45 H70 V105 H125 V125 H50 V25 Z" fill="none" stroke="black" strokeWidth={strokeWidth} />
          <line x1="25" y1="25" x2="50" y2="25" stroke="black" strokeWidth="1" />
          <line x1="25" y1="125" x2="50" y2="125" stroke="black" strokeWidth="1" />
          <text x="35" y="80" fontSize="12" textAnchor="middle">H</text>
          <line x1="125" y1="25" x2="150" y2="25" stroke="black" strokeWidth="1" />
          <text x="137" y="40" fontSize="12" textAnchor="middle">tf</text>
          <line x1="70" y1="45" x2="125" y2="45" stroke="black" strokeWidth="1" />
          <text x="97" y="55" fontSize="12" textAnchor="middle">tw</text>
          <line x1="125" y1="0" x2="125" y2="25" stroke="black" strokeWidth="1" />
          <text x="135" y="15" fontSize="12" textAnchor="middle">bf</text>
        </svg>
      );
    case 'Circular':
      return (
        <svg width={size} height={size} viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="50" fill="none" stroke="black" strokeWidth={strokeWidth} />
          <line x1="75" y1="25" x2="75" y2="125" stroke="black" strokeWidth="1" />
          <text x="85" y="80" fontSize="12" textAnchor="middle">D</text>
        </svg>
      );
    default:
      return null;
  }
};

// Add Poppins font
const addFontToPDF = () => {
  const pdfInstance = new jsPDF();
  
  // You'll need to add different font weights
  pdfInstance.addFont("path/to/Poppins-Regular.ttf", "Poppins", "normal");
  pdfInstance.addFont("path/to/Poppins-Bold.ttf", "Poppins", "bold");
  pdfInstance.addFont("path/to/Poppins-SemiBold.ttf", "Poppins", "semibold");
};

export default function BeamLoadCalculator() {
  const [beamType, setBeamType] = useState('Simple Beam')
  const [beamCrossSection, setBeamCrossSection] = useState('Rectangular')
  const [beamLength, setBeamLength] = useState(1000)
  const [leftSupport, setLeftSupport] = useState(0)
  const [rightSupport, setRightSupport] = useState(1000)
  const [loads, setLoads] = useState<Load[]>([
    { type: 'Point Load', magnitude: 1000, startPosition: 500 }
  ])
  const [shearForceData, setShearForceData] = useState<Array<{ x: number; y: number }>>([])
  const [bendingMomentData, setBendingMomentData] = useState<Array<{ x: number; y: number }>>([])
  const [material, setMaterial] = useState<keyof typeof standardMaterials>('ASTM A36 Structural Steel')
  const [customMaterial, setCustomMaterial] = useState<CustomMaterial>({
    yieldStrength: 0,
    elasticModulus: 0,
    density: 0,  // Initialize all properties
  });
  
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(200)
  const [flangeWidth, setFlangeWidth] = useState(100)
  const [flangeThickness, setFlangeThickness] = useState(10)
  const [webThickness, setWebThickness] = useState(6)
  const [diameter, setDiameter] = useState(100)
  const [beamDensity, setBeamDensity] = useState(7850) // Default density for steel (kg/m³)
  const [beamWeight, setBeamWeight] = useState(0)
  const [results, setResults] = useState({
    maxShearForce: 0,
    maxBendingMoment: 0,
    maxNormalStress: 0,
    maxShearStress: 0,
    safetyFactor: 0,
    centerOfGravity: 0,
    momentOfInertia: 0,
    sectionModulus: 0,
  })

  const addLoad = () => {
    if (loads.length < 3) {
      setLoads([...loads, { type: 'Point Load', magnitude: 1000, startPosition: beamLength / 2 }])
    }
  }

  const removeLoad = (index: number) => {
    setLoads(loads.filter((_, i) => i !== index))
  }

  const updateLoad = (index: number, updatedLoad: Partial<Load>) => {
    setLoads(loads.map((load, i) => i === index ? { ...load, ...updatedLoad } : load))
  }

  const calculateResults = useCallback(() => {
    // Convert mm to m for calculations
    const beamLengthM = beamLength / 1000
    const leftSupportM = leftSupport / 1000
    const rightSupportM = rightSupport / 1000
    const widthM = width / 1000
    const heightM = height / 1000
    const flangeWidthM = flangeWidth / 1000
    const flangeThicknessM = flangeThickness / 1000
    const webThicknessM = webThickness / 1000
    const diameterM = diameter / 1000

    // Calculate beam weight
    let beamVolume: number
    switch (beamCrossSection) {
      case 'Rectangular':
        beamVolume = widthM * heightM * beamLengthM
        break
      case 'I Beam':
        beamVolume = (2 * flangeWidthM * flangeThicknessM + (heightM - 2 * flangeThicknessM) * webThicknessM) * beamLengthM
        break
      case 'C Channel':
        beamVolume = (2 * flangeWidthM * flangeThicknessM + (heightM - 2 * flangeThicknessM) * webThicknessM) * beamLengthM
        break
      case 'Circular':
        beamVolume = Math.PI * Math.pow(diameterM / 2, 2) * beamLengthM
        break
      default:
        beamVolume = widthM * heightM * beamLengthM
    }
    const beamWeightN = beamVolume * beamDensity * 9.81 // Convert kg to N
    setBeamWeight(Number(beamWeightN.toFixed(2)))

    // Calculate reaction forces
    let R1 = 0
    let R2 = 0

    if (beamType === 'Simple Beam') {
      loads.forEach(load => {
        const loadStartPositionM = load.startPosition / 1000
        if (load.type === 'Point Load') {
          R1 += load.magnitude * (rightSupportM - loadStartPositionM) / (rightSupportM - leftSupportM)
          R2 += load.magnitude * (loadStartPositionM - leftSupportM) / (rightSupportM - leftSupportM)
        } else if (load.type === 'Uniform Load') {
          const loadEndPositionM = load.endPosition! / 1000
          const loadLengthM = loadEndPositionM - loadStartPositionM
          const totalLoad = load.magnitude * loadLengthM
          const loadCentroidM = (loadStartPositionM + loadEndPositionM) / 2
          R1 += totalLoad * (rightSupportM - loadCentroidM) / (rightSupportM - leftSupportM)
          R2 += totalLoad * (loadCentroidM - leftSupportM) / (rightSupportM - leftSupportM)
        }
      })
    } else if (beamType === 'Cantilever Beam') {
      loads.forEach(load => {
        if (load.type === 'Point Load') {
          R1 += load.magnitude
        } else if (load.type === 'Uniform Load') {
          const loadLengthM = (load.endPosition! - load.startPosition) / 1000
          R1 += load.magnitude * loadLengthM
        }
      })
    }

    // Calculate maximum shear force and bending moment
    let maxShearForce = Math.max(Math.abs(R1), Math.abs(R2))
    let maxBendingMoment = 0

    if (beamType === 'Simple Beam') {
      loads.forEach(load => {
        const loadStartPositionM = load.startPosition / 1000
        if (load.type === 'Point Load') {
          const momentAtLoad = R1 * (loadStartPositionM - leftSupportM)
          maxBendingMoment = Math.max(maxBendingMoment, momentAtLoad)
        } else if (load.type === 'Uniform Load') {
          const loadEndPositionM = load.endPosition! / 1000
          const loadLengthM = loadEndPositionM - loadStartPositionM
          const momentAtStart = (R1 * (loadStartPositionM - leftSupportM)) - 
                                (load.magnitude * loadLengthM * (loadStartPositionM - leftSupportM + loadLengthM / 2) / 2)
          const momentAtEnd = (R1 * (loadEndPositionM - leftSupportM)) - 
                              (load.magnitude * loadLengthM * (loadEndPositionM - leftSupportM - loadLengthM / 2) / 2)
          maxBendingMoment = Math.max(maxBendingMoment, momentAtStart, momentAtEnd)
        }
      })
    } else if (beamType === 'Cantilever Beam') {
      loads.forEach(load => {
        if (load.type === 'Point Load') {
          const momentAtFixed = load.magnitude * (beamLengthM - load.startPosition / 1000)
          maxBendingMoment = Math.max(maxBendingMoment, momentAtFixed)
        } else if (load.type === 'Uniform Load') {
          const loadLengthM = (load.endPosition! - load.startPosition) / 1000
          const momentAtFixed = load.magnitude * loadLengthM * (beamLengthM - (load.startPosition / 1000 + load.endPosition! / 1000) / 2)
          maxBendingMoment = Math.max(maxBendingMoment, momentAtFixed)
        }
      })
    }

    // Calculate cross-sectional properties
    const materialProps = material === 'Custom' ? customMaterial : standardMaterials[material]
    let area: number, momentOfInertia: number, sectionModulus: number

    switch (beamCrossSection) {
      case 'Rectangular':
        area = widthM * heightM
        momentOfInertia = (widthM * Math.pow(heightM, 3)) / 12
        sectionModulus = momentOfInertia / (heightM / 2)
        break
      case 'I Beam':
        area = 2 * flangeWidthM * flangeThicknessM + (heightM - 2 * flangeThicknessM) * webThicknessM
        const I_flange = (flangeWidthM * Math.pow(flangeThicknessM, 3)) / 6 + 2 * flangeWidthM * flangeThicknessM * Math.pow((heightM - flangeThicknessM) / 2, 2)
        const I_web = (webThicknessM * Math.pow(heightM - 2 * flangeThicknessM, 3)) / 12
        momentOfInertia = 2 * I_flange + I_web
        sectionModulus = momentOfInertia / (heightM / 2)
        break
      case 'C Channel':
        area = 2 * flangeWidthM * flangeThicknessM + (heightM - 2 * flangeThicknessM) * webThicknessM
        const I_flange_c = (flangeWidthM * Math.pow(flangeThicknessM, 3)) / 12 + flangeWidthM * flangeThicknessM * Math.pow((heightM - flangeThicknessM) / 2, 2)
        const I_web_c = (webThicknessM * Math.pow(heightM - 2 * flangeThicknessM, 3)) / 12
        momentOfInertia = 2 * I_flange_c + I_web_c
        sectionModulus = momentOfInertia / (heightM / 2)
        break
      case 'Circular':
        area = Math.PI * Math.pow(diameterM / 2, 2)
        momentOfInertia = (Math.PI * Math.pow(diameterM, 4)) / 64
        sectionModulus = momentOfInertia / (diameterM / 2)
        break
      default:
        area = widthM * heightM
        momentOfInertia = (widthM * Math.pow(heightM, 3)) / 12
        sectionModulus = momentOfInertia / (heightM / 2)
    }

    // Calculate stresses
    const maxNormalStress = (maxBendingMoment / sectionModulus) / 1e6 // Convert to MPa
    const maxShearStress = (1.5 * maxShearForce / area) / 1e6 // Convert to MPa

    setResults({
      maxShearForce: Number(maxShearForce.toFixed(2)),
      maxBendingMoment: Number(maxBendingMoment.toFixed(2)),
      maxNormalStress: Number(maxNormalStress.toFixed(2)),
      maxShearStress: Number(maxShearStress.toFixed(2)),
      safetyFactor: Number((materialProps.yieldStrength / maxNormalStress).toFixed(2)),
      centerOfGravity: Number((beamLengthM / 2).toFixed(3)),
      momentOfInertia: Number(momentOfInertia.toFixed(6)),
      sectionModulus: Number(sectionModulus.toFixed(6)),
    })
  }, [beamType, beamCrossSection, beamLength, leftSupport, rightSupport, loads, material, customMaterial, width, height, flangeWidth, flangeThickness, webThickness, diameter, beamDensity])

  const calculateDiagrams = useCallback(() => {
    const numPoints = 100;
    const dx = beamLength / (numPoints - 1);
    const shearForce = [];
    const bendingMoment = [];

    // Calculate reaction forces
    let R1 = 0;
    let R2 = 0;

    if (beamType === 'Simple Beam') {
      loads.forEach(load => {
        if (load.type === 'Point Load') {
          R1 += load.magnitude * (rightSupport - load.startPosition) / (rightSupport - leftSupport);
          R2 += load.magnitude * (load.startPosition - leftSupport) / (rightSupport - leftSupport);
        } else if (load.type === 'Uniform Load') {
          const loadLength = load.endPosition! - load.startPosition;
          const totalLoad = load.magnitude * loadLength;
          const loadCentroid = (load.startPosition + load.endPosition!) / 2;
          R1 += totalLoad * (rightSupport - loadCentroid) / (rightSupport - leftSupport);
          R2 += totalLoad * (loadCentroid - leftSupport) / (rightSupport - leftSupport);
        }
      });
    } else if (beamType === 'Cantilever Beam') {
      loads.forEach(load => {
        if (load.type === 'Point Load') {
          R1 += load.magnitude;
        } else if (load.type === 'Uniform Load') {
          const loadLength = load.endPosition! - load.startPosition;
          R1 += load.magnitude * loadLength;
        }
      });
    }

    for (let i = 0; i < numPoints; i++) {
      const x = i * dx;
      let shear = 0;
      let moment = 0;

      // Calculate shear force and bending moment
      if (beamType === 'Simple Beam') {
        if (x >= leftSupport) shear += R1;
        if (x >= rightSupport) shear -= R2;

        loads.forEach(load => {
          if (load.type === 'Point Load' && x >= load.startPosition) {
            shear -= load.magnitude;
          } else if (load.type === 'Uniform Load' && x >= load.startPosition) {
            const loadedLength = Math.min(x - load.startPosition, load.endPosition! - load.startPosition);
            shear -= load.magnitude * loadedLength;
          }
        });

        moment = R1 * (x - leftSupport);
        if (x > rightSupport) moment -= R2 * (x - rightSupport);

        loads.forEach(load => {
          if (load.type === 'Point Load' && x > load.startPosition) {
            moment -= load.magnitude * (x - load.startPosition);
          } else if (load.type === 'Uniform Load' && x > load.startPosition) {
            const loadedLength = Math.min(x - load.startPosition, load.endPosition! - load.startPosition);
            const loadCentroid = load.startPosition + loadedLength / 2;
            moment -= load.magnitude * loadedLength * (x - loadCentroid);
          }
        });
      } else if (beamType === 'Cantilever Beam') {
        loads.forEach(load => {
          if (load.type === 'Point Load') {
            if (x <= load.startPosition) {
              shear = -load.magnitude;
              moment = -load.magnitude * (beamLength - load.startPosition);
            } else {
              shear = 0;
              moment = 0;
            }
          } else if (load.type === 'Uniform Load') {
            const loadLength = load.endPosition! - load.startPosition;
            if (x <= load.startPosition) {
              shear = -load.magnitude * loadLength;
              moment = -load.magnitude * loadLength * (beamLength - (load.startPosition + load.endPosition!) / 2);
            } else if (x > load.startPosition && x < load.endPosition!) {
              const remainingLength = load.endPosition! - x;
              shear = -load.magnitude * remainingLength;
              moment = -load.magnitude * remainingLength * remainingLength / 2;
            } else {
              shear = 0;
              moment = 0;
            }
          }
        });
      }

      shearForce.push({ x: Number(x.toFixed(2)), y: Number(shear.toFixed(2)) });
      bendingMoment.push({ x: Number(x.toFixed(2)), y: Number(moment.toFixed(2)) });
    }

    setShearForceData(shearForce);
    setBendingMomentData(bendingMoment);
  }, [beamType, beamLength, leftSupport, rightSupport, loads]);

  useEffect(() => {
    calculateResults();
    calculateDiagrams();
  }, [calculateResults, calculateDiagrams]);

  useEffect(() => {
    addFontToPDF();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      console.log('Starting PDF generation');
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("Poppins", "bold");
      pdf.text('Beam Analysis Report', pageWidth / 2, 20, { align: 'center' });

      // Date
      pdf.setFontSize(12);
      pdf.setFont("Poppins", "normal");
      const date = new Date().toLocaleDateString();
      pdf.text(`Date: ${date}`, pageWidth / 2, 30, { align: 'center' });

      // Enhanced Load Calculator
      pdf.setFont("Poppins", "normal");
      pdf.text('Enhanced Load Calculator', pageWidth / 2, 40, { align: 'center' });

      // 1. Beam Configuration
      let y = 60;
      pdf.setFontSize(14);
      pdf.setFont("Poppins", "semibold");
      pdf.text('1. Beam Configuration', margin, y);
      
      pdf.setFontSize(12);
      pdf.setFont("Poppins", "normal");
      y += 10;
      pdf.text(`Beam Type: ${beamType}`, margin, y);
      y += 10;
      pdf.text(`Beam Cross Section: ${beamCrossSection}`, margin, y);
      y += 10;
      pdf.text(`Beam Length: ${beamLength} mm`, margin, y);
      y += 10;
      pdf.text(`Left Support: ${leftSupport} mm`, margin, y);
      y += 10;
      pdf.text(`Right Support: ${rightSupport} mm`, margin, y);
      y += 10;
      pdf.text(`Material: ${material}`, margin, y);
      y += 10;
      pdf.text(`Beam Weight: ${beamWeight.toFixed(2)} N`, margin, y);

      // 2. Loads
      y += 20;
      pdf.setFontSize(14);
      pdf.setFont("Poppins", "semibold");
      pdf.text('2. Loads', margin, y);

      loads.forEach((load, index) => {
        y += 15;
        pdf.setFontSize(12);
        pdf.setFont("Poppins", "normal");
        pdf.text(`Load ${index + 1}:`, margin, y);
        y += 10;
        pdf.text(`  Type: ${load.type}`, margin, y);
        y += 10;
        pdf.text(`  Magnitude: ${load.magnitude} N`, margin, y);
        y += 10;
        pdf.text(`  Start Position: ${load.startPosition} mm`, margin, y);
        if (load.type === 'Uniform Load' && load.endPosition) {
          y += 10;
          pdf.text(`  End Position: ${load.endPosition} mm`, margin, y);
        }
      });

      // 3. Analysis Results
      y += 20;
      pdf.setFontSize(14);
      pdf.setFont("Poppins", "semibold");
      pdf.text('3. Analysis Results', margin, y);

      pdf.setFontSize(12);
      pdf.setFont("Poppins", "normal");
      y += 15;
      pdf.text(`Maximum Shear Force: ${results.maxShearForce} N`, margin, y);
      y += 10;
      pdf.text(`Maximum Bending Moment: ${results.maxBendingMoment} N⋅m`, margin, y);
      y += 10;
      pdf.text(`Maximum Normal Stress: ${results.maxNormalStress} MPa`, margin, y);
      y += 10;
      pdf.text(`Maximum Shear Stress: ${results.maxShearStress} MPa`, margin, y);
      y += 10;
      pdf.text(`Safety Factor: ${results.safetyFactor}`, margin, y);
      y += 10;
      pdf.text(`Center of Gravity: ${results.centerOfGravity} m`, margin, y);
      y += 10;
      pdf.text(`Moment of Inertia: ${results.momentOfInertia} m⁴`, margin, y);
      y += 10;
      pdf.text(`Section Modulus: ${results.sectionModulus} m³`, margin, y);

      // Add diagrams page
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setFont("Poppins", "semibold");
      pdf.text('4. Diagrams', margin, 20);

      // Capture and add beam diagram
      const beamDiagramElement = document.getElementById('beam-diagram');
      if (beamDiagramElement) {
        try {
          console.log('Capturing beam diagram');
          const canvas = await html2canvas(beamDiagramElement, {
            allowTaint: true,
            useCORS: true,
            scale: 2,
            backgroundColor: '#ffffff',
            logging: true,
          });
          
          const imgData = canvas.toDataURL('image/png');
          // Position beam diagram with proper spacing
          pdf.text('Beam Diagram:', margin, 30);
          pdf.addImage(imgData, 'PNG', margin, 35, pageWidth - 2 * margin, 50);
          console.log('Beam diagram added successfully');
        } catch (error) {
          console.error('Error capturing beam diagram:', error);
        }
      }

      // Add shear force diagram
      const shearForceElement = document.getElementById('shear-force-diagram');
      if (shearForceElement) {
        try {
          console.log('Capturing shear force diagram');
          const canvas = await html2canvas(shearForceElement);
          const imgData = canvas.toDataURL('image/png');
          pdf.text('Shear Force Diagram:', margin, 100);
          pdf.addImage(imgData, 'PNG', margin, 105, pageWidth - 2 * margin, 50);
        } catch (error) {
          console.error('Error capturing shear force diagram:', error);
        }
      }

      // Add bending moment diagram
      const bendingMomentElement = document.getElementById('bending-moment-diagram');
      if (bendingMomentElement) {
        try {
          console.log('Capturing bending moment diagram');
          const canvas = await html2canvas(bendingMomentElement);
          const imgData = canvas.toDataURL('image/png');
          pdf.text('Bending Moment Diagram:', margin, 170);
          pdf.addImage(imgData, 'PNG', margin, 175, pageWidth - 2 * margin, 50);
        } catch (error) {
          console.error('Error capturing bending moment diagram:', error);
        }
      }

      console.log('Saving PDF');
      pdf.save('beam_analysis_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Enhanced Beam Load Calculator</h1>
        <Button onClick={handleDownloadPDF}>Download PDF Report</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Beam Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="beamType">Beam Type</Label>
                <Select value={beamType} onValueChange={setBeamType}>
                  <SelectTrigger id="beamType">
                    <SelectValue placeholder="Select beam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple Beam">Simple Beam</SelectItem>
                    <SelectItem value="Cantilever Beam">Cantilever Beam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="beamCrossSection">Beam Cross Section</Label>
                <Select value={beamCrossSection} onValueChange={setBeamCrossSection}>
                  <SelectTrigger id="beamCrossSection">
                    <SelectValue placeholder="Select beam cross section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rectangular">Rectangular</SelectItem>
                    <SelectItem value="I Beam">I Beam</SelectItem>
                    <SelectItem value="C Channel">C Channel</SelectItem>
                    <SelectItem value="Circular">Circular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="beamLength">Beam Length (mm)</Label>
                <Input
                  id="beamLength"
                  type="number"
                  value={beamLength}
                  onChange={(e) => setBeamLength(Number(e.target.value))}
                />
              </div>
              {beamType === 'Simple Beam' && (
                <>
                  <div>
                    <Label htmlFor="leftSupport">Left Support (mm)</Label>
                    <Input
                      id="leftSupport"
                      type="number"
                      value={leftSupport}
                      onChange={(e) => setLeftSupport(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rightSupport">Right Support (mm)</Label>
                    <Input
                      id="rightSupport"
                      type="number"
                      value={rightSupport}
                      onChange={(e) => setRightSupport(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="material">Material</Label>
                <Select value={material} onValueChange={(value) => setMaterial(value as typeof material)}>
                  <SelectTrigger id="material">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(standardMaterials).map((mat) => (
                      <SelectItem key={mat} value={mat}>
                        {mat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {material === 'Custom' && (
                <>
                  <div>
                    <Label htmlFor="yieldStrength">Yield Strength (MPa)</Label>
                    <Input
                      id="yieldStrength"
                      type="number"
                      value={customMaterial.yieldStrength}
                      onChange={(e) =>
                        setCustomMaterial({ ...customMaterial, yieldStrength: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="elasticModulus">Elastic Modulus (GPa)</Label>
                    <Input
                      id="elasticModulus"
                      type="number"
                      value={customMaterial.elasticModulus}
                      onChange={(e) =>
                        setCustomMaterial({ ...customMaterial, elasticModulus: Number(e.target.value) })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cross Section Dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {beamCrossSection === 'Rectangular' && (
                <>
                  <div>
                    <Label htmlFor="width">Width (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (mm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
              {(beamCrossSection === 'I Beam' || beamCrossSection === 'C Channel') && (
                <>
                  <div>
                    <Label htmlFor="flangeWidth">Flange Width (mm)</Label>
                    <Input
                      id="flangeWidth"
                      type="number"
                      value={flangeWidth}
                      onChange={(e) => setFlangeWidth(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="flangeThickness">Flange Thickness (mm)</Label>
                    <Input
                      id="flangeThickness"
                      type="number"
                      value={flangeThickness}
                      onChange={(e) => setFlangeThickness(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="webThickness">Web Thickness (mm)</Label>
                    <Input
                      id="webThickness"
                      type="number"
                      value={webThickness}
                      onChange={(e) => setWebThickness(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (mm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
              {beamCrossSection === 'Circular' && (
                <div>
                  <Label htmlFor="diameter">Diameter (mm)</Label>
                  <Input
                    id="diameter"
                    type="number"
                    value={diameter}
                    onChange={(e) => setDiameter(Number(e.target.value))}
                  />
                </div>
              )}
              <BeamCrossSectionImage type={beamCrossSection} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loads.map((load, index) => (
                <div key={index} className="space-y-2 border p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold">Load {index + 1}</h4>
                    {index > 0 && (
                      <Button variant="destructive" size="sm" onClick={() => removeLoad(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`loadType-${index}`}>Load Type</Label>
                    <Select
                      value={load.type}
                      onValueChange={(value) => updateLoad(index, { type: value as 'Point Load' | 'Uniform Load' })}
                    >
                      <SelectTrigger id={`loadType-${index}`}>
                        <SelectValue placeholder="Select load type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Point Load">Point Load</SelectItem>
                        <SelectItem value="Uniform Load">Uniform Load</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`magnitude-${index}`}>Magnitude (N)</Label>
                    <Input
                      id={`magnitude-${index}`}
                      type="number"
                      value={load.magnitude}
                      onChange={(e) => updateLoad(index, { magnitude: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`startPosition-${index}`}>Start Position (mm)</Label>
                    <Input
                      id={`startPosition-${index}`}
                      type="number"
                      value={load.startPosition}
                      onChange={(e) => updateLoad(index, { startPosition: Number(e.target.value) })}
                    />
                  </div>
                  {load.type === 'Uniform Load' && (
                    <div>
                      <Label htmlFor={`endPosition-${index}`}>End Position (mm)</Label>
                      <Input
                        id={`endPosition-${index}`}
                        type="number"
                        value={load.endPosition}
                        onChange={(e) => updateLoad(index, { endPosition: Number(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              ))}
              {loads.length < 3 && (
                <Button onClick={addLoad}>Add Load</Button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Max Shear Force: {results.maxShearForce} N</p>
              <p>Max Bending Moment: {results.maxBendingMoment} N⋅m</p>
              <p>Max Normal Stress: {results.maxNormalStress} MPa</p>
              <p>Max Shear Stress: {results.maxShearStress} MPa</p>
              <p>Safety Factor: {results.safetyFactor}</p>
              <p>Center of Gravity: {results.centerOfGravity} m</p>
              <p>Moment of Inertia: {results.momentOfInertia} m⁴</p>
              <p>Section Modulus: {results.sectionModulus} m³</p>
              <p>Beam Weight: {beamWeight.toFixed(2)} N</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Beam Diagram</h2>
        <div 
          id="beam-diagram" 
          className="bg-white p-4 rounded-lg shadow-sm"
          style={{ 
            minHeight: '200px',
            border: '1px solid #e5e7eb',
            margin: '0 auto',
            width: 'fit-content'
          }}
        >
          <BeamDiagram
            beamLength={beamLength}
            leftSupport={leftSupport}
            rightSupport={rightSupport}
            loads={loads}
          />
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Shear Force Diagram</h2>
        <div id="shear-force-diagram" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={shearForceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" label={{ value: 'Position (mm)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Shear Force (N)', angle: -90, position: 'insideLeft' }} />
              <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} />
              <ChartTooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Bending Moment Diagram</h2>
        <div id="bending-moment-diagram" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={bendingMomentData}
              margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ 
                  value: 'Position (mm)', 
                  position: 'insideBottom', 
                  offset: -10 
                }}
              />
              <YAxis 
                label={{ 
                  value: 'Bending Moment (kN⋅m)', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: -60,
                  style: { textAnchor: 'middle' }
                }}
                tickFormatter={(value) => (value / 1000).toFixed(2)}
              />
              <Line type="monotone" dataKey="y" stroke="#82ca9d" dot={false} />
              <ChartTooltip 
                formatter={(value: number) => [`${(value / 1000).toFixed(2)} kN⋅m`, 'Bending Moment']}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <footer className="mt-16 pb-4 text-center text-sm text-gray-500">
        hbradroc@uwo.ca &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}