// src/app/components/map/map.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import Leaflet
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';





// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Department {
  name: string;
  airQuality: number;
  waterQuality: string;
  deforestation: number;
  healthImpact: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  coordinates: [number, number];
}

interface CategoryData {
  title: string;
  description: string;
  nasaDataSources: string[];
  keyMetrics: { name: string; value: string; level: 'low' | 'medium' | 'high' }[];
  recommendations: string[];
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, OnDestroy {
  private map: L.Map | undefined;
  private departmentMap: L.Map | undefined; // NUEVO: mapa del departamento
  selectedDepartment: Department | null = null;
  showDetailedView: boolean = false;
  currentCategory: string | null = null;
  categoryData: CategoryData | null = null;

  // Datos de ejemplo para departamentos de Perú
  private peruDepartments: Department[] = [
    {
      name: 'Lima',
      airQuality: 85,
      waterQuality: 'Moderate',
      deforestation: 12,
      healthImpact: 'Medium - Respiratory issues common in urban areas',
      riskLevel: 'medium',
      coordinates: [-12.0464, -77.0428]
    },
    {
      name: 'Arequipa',
      airQuality: 65,
      waterQuality: 'Good - Minimal contamination',
      deforestation: 8,
      healthImpact: 'Low - Few environmental health concerns',
      riskLevel: 'low',
      coordinates: [-16.4090, -71.5375]
    },
    {
      name: 'Cusco',
      airQuality: 75,
      waterQuality: 'Moderate - Some agricultural runoff',
      deforestation: 15,
      healthImpact: 'Medium - Seasonal air quality issues from tourism',
      riskLevel: 'medium',
      coordinates: [-13.5320, -71.9675]
    },
    {
      name: 'Loreto',
      airQuality: 45,
      waterQuality: 'Poor - Mining contamination in rivers',
      deforestation: 25,
      healthImpact: 'High - Waterborne diseases prevalent',
      riskLevel: 'high',
      coordinates: [-3.7491, -73.2530]
    },
    {
      name: 'Madre de Dios',
      airQuality: 40,
      waterQuality: 'Poor - Heavy metal contamination from mining',
      deforestation: 35,
      healthImpact: 'Critical - Mercury exposure affecting communities',
      riskLevel: 'critical',
      coordinates: [-12.6, -70.1]
    },
    {
      name: 'Piura',
      airQuality: 70,
      waterQuality: 'Moderate - Industrial pollution in coastal areas',
      deforestation: 18,
      healthImpact: 'Medium - Water scarcity during dry seasons',
      riskLevel: 'medium',
      coordinates: [-5.1945, -80.6328]
    },
    {
      name: 'La Libertad',
      airQuality: 68,
      waterQuality: 'Good - Well maintained water infrastructure',
      deforestation: 10,
      healthImpact: 'Low - Good environmental conditions',
      riskLevel: 'low',
      coordinates: [-8.1092, -79.0215]
    },
    {
      name: 'Amazonas',
      airQuality: 55,
      waterQuality: 'Moderate - Deforestation runoff affecting rivers',
      deforestation: 22,
      healthImpact: 'High - Loss of biodiversity affecting traditional medicine',
      riskLevel: 'high',
      coordinates: [-5.0703, -78.1583]
    },
    {
      name: 'Puno',
      airQuality: 72,
      waterQuality: 'Good - Clean mountain water sources',
      deforestation: 9,
      healthImpact: 'Low - Clean high-altitude environment',
      riskLevel: 'low',
      coordinates: [-15.8402, -70.0219]
    }
  ];

  // Datos detallados para cada categoría
  private categoryDetails: { [key: string]: (dept: Department) => CategoryData } = {
    'air': (dept) => ({
      title: 'Air Quality Analysis - ' + dept.name,
      description: `Indicator scores for the selected region ${dept.name} using NASA satellite data`,
      nasaDataSources: [
        'MODIS Aerosol Optical Depth',
        'CALIPSO Lidar Measurements',
        'TEMPO Tropospheric Emissions',
        'OMI Nitrogen Dioxide Levels'
      ],
      keyMetrics: [
        { 
          name: 'Tropospheric ozone(O3)', 
          value: `${dept.airQuality} μg/m³`, 
          level: this.getAirQualityLevel(dept.airQuality)
        },
        { 
          name: 'Sulfur dioxide (SO2)', 
          value: this.calculateAQI(dept.airQuality), 
          level: this.getAQILevel(dept.airQuality)
        },
        { 
          name: 'Nitrogen dioxide (NO2)', 
          value: this.calculateAQI(dept.airQuality), 
          level: this.getAQILevel(dept.airQuality)
        },
        { 
          name: 'Health Impact', 
          value: dept.healthImpact, 
          level: this.getHealthImpactLevel(dept.healthImpact)
        }
      ],
      recommendations: [
        'Implement vehicle emission controls in urban areas',
        'Promote green spaces to improve air filtration',
        'Monitor industrial emissions regularly',
        'Develop early warning systems for poor air quality days',
        'Promote public transportation and electric vehicles',
        'Implement air quality monitoring stations across the region'
      ]
    }),

    'water': (dept) => ({
      title: 'Water Resources Analysis',
      description: `Assessment of water quality and availability in ${dept.name} using NASA GRACE, SWOT, and Landsat data.`,
      nasaDataSources: [
        'GRACE Water Storage',
        'SWOT Surface Water',
        'Landsat Water Quality',
        'MODIS Flood Monitoring'
      ],
      keyMetrics: [
        { name: 'Water Quality Index', value: dept.waterQuality, level: 'medium' },
        { name: 'Groundwater Levels', value: this.getGroundwaterLevel(dept.name), level: 'medium' },
        { name: 'Surface Water Availability', value: this.getWaterAvailability(dept.name), level: 'medium' },
        { name: 'Contamination Risk', value: this.getContaminationRisk(dept.waterQuality), level: 'medium' }
      ],
      recommendations: [
        'Implement watershed protection programs',
        'Upgrade water treatment facilities',
        'Monitor agricultural runoff',
        'Develop drought contingency plans'
      ]
    }),

    'vegetation': (dept) => ({
      title: 'Vegetation & Soil Analysis',
      description: `Comprehensive analysis of forest cover, soil health, and vegetation dynamics in ${dept.name}.`,
      nasaDataSources: [
        'Landsat Vegetation Index',
        'MODIS Fire Detection',
        'GEDI Forest Structure',
        'SMAP Soil Moisture'
      ],
      keyMetrics: [
        { name: 'Deforestation Rate', value: `${dept.deforestation}% annual loss`, level: 'medium' },
        { name: 'Vegetation Health', value: this.getVegetationHealth(dept.deforestation), level: 'medium' },
        { name: 'Soil Erosion Risk', value: this.getErosionRisk(dept.name), level: 'medium' },
        { name: 'Carbon Storage', value: this.getCarbonStorage(dept.deforestation), level: 'medium' }
      ],
      recommendations: [
        'Implement reforestation programs',
        'Promote sustainable agriculture',
        'Protect biodiversity hotspots',
        'Monitor illegal logging activities'
      ]
    }),

    'climate': (dept) => ({
      title: 'Climate & Meteorology',
      description: `Climate pattern analysis and meteorological monitoring for ${dept.name} using NASA satellite systems.`,
      nasaDataSources: [
        'TRMM Precipitation',
        'CERES Radiation Budget',
        'AIRS Temperature Profiles',
        'GPM Global Precipitation'
      ],
      keyMetrics: [
        { name: 'Temperature Trend', value: this.getTemperatureTrend(dept.name), level: 'medium' },
        { name: 'Precipitation Patterns', value: this.getPrecipitationPattern(dept.name), level: 'medium' },
        { name: 'Extreme Weather Risk', value: this.getWeatherRisk(dept.name), level: 'medium' },
        { name: 'Climate Change Impact', value: this.getClimateImpact(dept.name), level: 'medium' }
      ],
      recommendations: [
        'Develop climate adaptation strategies',
        'Implement early warning systems',
        'Promote water conservation',
        'Plan for climate-resilient infrastructure'
      ]
    }),

    'atmosphere': (dept) => ({
      title: 'Atmosphere & Sky Monitoring',
      description: `Upper atmosphere analysis and space-based observations for ${dept.name} using advanced NASA instruments.`,
      nasaDataSources: [
        'SAGE III Ozone',
        'CALIPSO Cloud-Aerosol',
        'TES Tropospheric Chemistry',
        'OMPS Limb Profiler'
      ],
      keyMetrics: [
        { name: 'Ozone Layer Health', value: this.getOzoneHealth(dept.name), level: 'medium' },
        { name: 'UV Radiation Levels', value: this.getUVLevel(dept.name), level: 'medium' },
        { name: 'Atmospheric Stability', value: this.getAtmosphericStability(dept.name), level: 'medium' },
        { name: 'Satellite Coverage', value: this.getSatelliteCoverage(dept.name), level: 'medium' }
      ],
      recommendations: [
        'Monitor stratospheric ozone levels',
        'Track atmospheric composition changes',
        'Study aerosol impacts on climate',
        'Develop air quality forecasting models'
      ]
    }),

    'ods11': (dept) => ({
      title: 'ODS 11 - Sustainable Cities & Communities',
      description: `Analysis of ${dept.name}'s progress towards UN Sustainable Development Goal 11 using NASA urban monitoring data.`,
      nasaDataSources: [
        'Landsat Urban Growth',
        'VIIRS Nighttime Lights',
        'SMAP Urban Heat Islands',
        'GEDI Building Density'
      ],
      keyMetrics: [
        { name: 'Urban Sustainability', value: this.getUrbanSustainability(dept.name), level: 'medium' },
        { name: 'Green Space Access', value: this.getGreenSpaceAccess(dept.name), level: 'medium' },
        { name: 'Public Transport Coverage', value: this.getTransportCoverage(dept.name), level: 'medium' },
        { name: 'SDG 11 Progress', value: this.getSDGProgress(dept.name), level: 'medium' }
      ],
      recommendations: [
        'Develop sustainable urban planning',
        'Increase green infrastructure',
        'Improve public transportation',
        'Promote affordable housing',
        'Enhance disaster resilience'
      ]
    })
  };

  // NUEVO MÉTODO PARA HEALTH IMPACT
  private getHealthImpactLevel(healthImpact: string): 'low' | 'medium' | 'high' {
    if (healthImpact.includes('Low')) return 'low';
    if (healthImpact.includes('Medium')) return 'medium';
    if (healthImpact.includes('High') || healthImpact.includes('Critical')) return 'high';
    return 'medium';
  }

  ngOnInit() {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    // NUEVO: Limpiar el mapa del departamento también
    if (this.departmentMap) {
      this.departmentMap.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('map').setView([-9.1900, -75.0152], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);

    this.addDepartmentMarkers();

    this.map.on('click', () => {
      this.closePanel();
    });

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private addDepartmentMarkers(): void {
    if (!this.map) return;

    this.peruDepartments.forEach(dept => {
      const riskColors = {
        low: '#27ae60',
        medium: '#f39c12', 
        high: '#e74c3c',
        critical: '#c0392b'
      };

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="location-pin" style="--risk-color: ${riskColors[dept.riskLevel]}">
            <div class="pin-head"></div>
            <div class="pin-shadow"></div>
            <div class="pulse-animation"></div>
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      const marker = L.marker(dept.coordinates, { icon: customIcon })
        .addTo(this.map!)
        .bindTooltip(`
          <div style="text-align: center;">
            <strong>${dept.name}</strong><br>
            Click for details
          </div>
        `, {
          permanent: false,
          direction: 'top'
        });

      marker.on('click', (e) => {
        e.originalEvent?.stopPropagation();
        this.selectDepartment(dept.name);
      });

      marker.on('mouseover', () => {
        marker.openTooltip();
      });

      marker.on('mouseout', () => {
        marker.closeTooltip();
      });
    });
  }

  selectDepartment(departmentName: string): void {
    const department = this.peruDepartments.find(dept => dept.name === departmentName);
    if (department) {
      this.selectedDepartment = department;
      this.showDetailedView = false;
      this.currentCategory = null;
      this.categoryData = null;
      
      if (this.map) {
        this.map.setView(department.coordinates, 7);
      }
    }
  }

  closePanel(): void {
    this.selectedDepartment = null;
    this.showDetailedView = false;
    this.currentCategory = null;
    this.categoryData = null;
    
    // NUEVO: Limpiar el mapa del departamento
    if (this.departmentMap) {
      this.departmentMap.remove();
      this.departmentMap = undefined;
    }
  }

  openCategory(category: string): void {
    if (!this.selectedDepartment) return;
    
    this.currentCategory = category;
    this.categoryData = this.categoryDetails[category](this.selectedDepartment);
    
    // Forzar un pequeño delay para que Angular actualice la vista
    setTimeout(() => {
      const panel = document.querySelector('.info-panel');
      if (panel) {
        panel.classList.add('category-details-open');
      }
      
      // NUEVO: Inicializar el mapa del departamento después de que se muestre el panel
      this.initDepartmentMap();
    }, 50);
  }

  openHealthDetails(): void {
    console.log('Health details clicked');
  }

  // AGREGA EL MÉTODO simulateIntervention AQUÍ
simulateIntervention(): void {
  console.log('Simulate intervention clicked for:', this.selectedDepartment?.name);
  // Aquí puedes agregar la lógica para simular intervenciones
  alert(`Simulating intervention for ${this.selectedDepartment?.name}\nThis would show predictive models and potential outcomes.`);
}

  closeCategory(): void {
    this.currentCategory = null;
    this.categoryData = null;
    
    // NUEVO: Destruir el mapa del departamento cuando se cierra la categoría
    if (this.departmentMap) {
      this.departmentMap.remove();
      this.departmentMap = undefined;
    }
  }

  // NUEVO: Método para inicializar el mapa del departamento
  private initDepartmentMap(): void {
    // Esperar a que el DOM se actualice
    setTimeout(() => {
      const mapContainer = document.getElementById('department-map');
      
      if (!mapContainer || !this.selectedDepartment) return;
      
      // Limpiar mapa anterior si existe
      if (this.departmentMap) {
        this.departmentMap.remove();
      }
      
      // Crear nuevo mapa
      this.departmentMap = L.map('department-map').setView(
        this.selectedDepartment.coordinates, 
        9 // Zoom más cercano para el departamento
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 13
      }).addTo(this.departmentMap);

      // Agregar marcador del departamento
      const riskColors = {
        low: '#27ae60',
        medium: '#f39c12', 
        high: '#e74c3c',
        critical: '#c0392b'
      };

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="location-pin" style="--risk-color: ${riskColors[this.selectedDepartment.riskLevel]}">
            <div class="pin-head"></div>
            <div class="pin-shadow"></div>
            <div class="pulse-animation"></div>
          </div>
        `,
        iconSize: [25, 35],
        iconAnchor: [12, 35]
      });

      const marker = L.marker(this.selectedDepartment.coordinates, { icon: customIcon })
        .addTo(this.departmentMap)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>${this.selectedDepartment.name}</strong><br>
            <small>${this.selectedDepartment.riskLevel.toUpperCase()} Risk Level</small>
          </div>
        `);

      // Ajustar el tamaño del mapa
      setTimeout(() => {
        this.departmentMap?.invalidateSize();
      }, 100);
    }, 100);
  }

  // Métodos auxiliares para generar datos dinámicos
  private calculateAQI(airQuality: number): string {
    if (airQuality <= 50) return 'Good';
    if (airQuality <= 100) return 'Moderate';
    if (airQuality <= 150) return 'Unhealthy for Sensitive Groups';
    return 'Unhealthy';
  }

  private getAirQualityLevel(airQuality: number): 'low' | 'medium' | 'high' {
    if (airQuality <= 50) return 'low';
    if (airQuality <= 100) return 'medium';
    return 'high';
  }

  private getAQILevel(airQuality: number): 'low' | 'medium' | 'high' {
    if (airQuality <= 50) return 'low';
    if (airQuality <= 100) return 'medium';
    return 'high';
  }

  private getOzoneLevelValue(airQuality: number): 'low' | 'medium' | 'high' {
    if (airQuality <= 50) return 'low';
    if (airQuality <= 100) return 'medium';
    return 'high';
  }

  private getNO2LevelValue(airQuality: number): 'low' | 'medium' | 'high' {
    if (airQuality <= 50) return 'low';
    if (airQuality <= 100) return 'medium';
    return 'high';
  }

  private getSO2Level(airQuality: number): string {
    if (airQuality <= 50) return 'Low (0-35 ppb)';
    if (airQuality <= 100) return 'Moderate (36-75 ppb)';
    return 'High (>75 ppb)';
  }

  private getSO2LevelValue(airQuality: number): 'low' | 'medium' | 'high' {
    if (airQuality <= 50) return 'low';
    if (airQuality <= 100) return 'medium';
    return 'high';
  }

  private getCOLevel(airQuality: number): string {
    if (airQuality <= 50) return 'Low (0-4.4 ppm)';
    if (airQuality <= 100) return 'Moderate (4.5-9.4 ppm)';
    return 'High (>9.4 ppm)';
  }

  private getCOLevelValue(airQuality: number): 'low' | 'medium' | 'high' {
    if (airQuality <= 50) return 'low';
    if (airQuality <= 100) return 'medium';
    return 'high';
  }

  private getGroundwaterLevel(department: string): string {
    const levels: { [key: string]: string } = {
      'Lima': 'Stable',
      'Arequipa': 'High',
      'Cusco': 'Moderate',
      'Loreto': 'Very High',
      'Madre de Dios': 'High',
      'Piura': 'Low',
      'La Libertad': 'Moderate',
      'Amazonas': 'Very High',
      'Puno': 'High'
    };
    return levels[department] || 'Moderate';
  }

  private getWaterAvailability(department: string): string {
    const availability: { [key: string]: string } = {
      'Lima': 'Limited',
      'Arequipa': 'Adequate',
      'Cusco': 'Seasonal',
      'Loreto': 'Abundant',
      'Madre de Dios': 'Abundant',
      'Piura': 'Limited',
      'La Libertad': 'Adequate',
      'Amazonas': 'Abundant',
      'Puno': 'Adequate'
    };
    return availability[department] || 'Adequate';
  }

  private getContaminationRisk(waterQuality: string): string {
    if (waterQuality.includes('Good')) return 'Low';
    if (waterQuality.includes('Moderate')) return 'Medium';
    return 'High';
  }

  private getVegetationHealth(deforestation: number): string {
    if (deforestation <= 10) return 'Excellent';
    if (deforestation <= 20) return 'Good';
    if (deforestation <= 30) return 'Fair';
    return 'Poor';
  }

  private getErosionRisk(department: string): string {
    const risks: { [key: string]: string } = {
      'Lima': 'High',
      'Arequipa': 'Medium',
      'Cusco': 'High',
      'Loreto': 'Low',
      'Madre de Dios': 'Low',
      'Piura': 'High',
      'La Libertad': 'Medium',
      'Amazonas': 'Low',
      'Puno': 'Medium'
    };
    return risks[department] || 'Medium';
  }

  private getCarbonStorage(deforestation: number): string {
    if (deforestation <= 10) return 'High (>100 tons/ha)';
    if (deforestation <= 20) return 'Medium (50-100 tons/ha)';
    if (deforestation <= 30) return 'Low (20-50 tons/ha)';
    return 'Very Low (<20 tons/ha)';
  }

  private getTemperatureTrend(department: string): string {
    return '+1.2°C since 1980';
  }

  private getPrecipitationPattern(department: string): string {
    return 'Decreasing trend in dry season';
  }

  private getWeatherRisk(department: string): string {
    return 'Moderate risk of extreme events';
  }

  private getClimateImpact(department: string): string {
    return 'Significant impact on agriculture';
  }

  private getOzoneHealth(department: string): string {
    return 'Stable with seasonal variations';
  }

  private getUVLevel(department: string): string {
    return 'High due to altitude and latitude';
  }

  private getAtmosphericStability(department: string): string {
    return 'Generally stable with seasonal variations';
  }

  private getSatelliteCoverage(department: string): string {
    return 'Excellent (multiple daily passes)';
  }

  private getUrbanSustainability(department: string): string {
    const sustainability: { [key: string]: string } = {
      'Lima': 'Developing',
      'Arequipa': 'Good',
      'Cusco': 'Moderate',
      'Loreto': 'Poor',
      'Madre de Dios': 'Poor',
      'Piura': 'Developing',
      'La Libertad': 'Good',
      'Amazonas': 'Poor',
      'Puno': 'Moderate'
    };
    return sustainability[department] || 'Moderate';
  }

  private getGreenSpaceAccess(department: string): string {
    const access: { [key: string]: string } = {
      'Lima': 'Limited',
      'Arequipa': 'Good',
      'Cusco': 'Moderate',
      'Loreto': 'Excellent',
      'Madre de Dios': 'Excellent',
      'Piura': 'Limited',
      'La Libertad': 'Good',
      'Amazonas': 'Excellent',
      'Puno': 'Good'
    };
    return access[department] || 'Moderate';
  }

  private getTransportCoverage(department: string): string {
    const coverage: { [key: string]: string } = {
      'Lima': 'Extensive',
      'Arequipa': 'Good',
      'Cusco': 'Moderate',
      'Loreto': 'Limited',
      'Madre de Dios': 'Limited',
      'Piura': 'Moderate',
      'La Libertad': 'Good',
      'Amazonas': 'Limited',
      'Puno': 'Moderate'
    };
    return coverage[department] || 'Moderate';
  }

  private getSDGProgress(department: string): string {
    const progress: { [key: string]: string } = {
      'Lima': '60% Complete',
      'Arequipa': '75% Complete',
      'Cusco': '55% Complete',
      'Loreto': '40% Complete',
      'Madre de Dios': '35% Complete',
      'Piura': '50% Complete',
      'La Libertad': '70% Complete',
      'Amazonas': '45% Complete',
      'Puno': '65% Complete'
    };
    return progress[department] || '50% Complete';
  }
} 