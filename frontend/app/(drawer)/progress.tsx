import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  progressService,
  WorkoutOverview,
  TrendPoint,
  PersonalRecord,
  MuscleGroupActivity,
} from '@/services/progress.service';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [overview, setOverview] = useState<WorkoutOverview | null>(null);
  const [volumeTrend, setVolumeTrend] = useState<TrendPoint[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchProgressData();
  }, [selectedPeriod]);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      
      // Get date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      if (selectedPeriod === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      const dateParams = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      };
      
      // Fetch data in parallel
      const [overviewData, volumeData, recordsData, muscleData] = await Promise.all([
        progressService.getWorkoutOverview(dateParams),
        progressService.getWorkoutTrends({ ...dateParams, metric: 'volume' }),
        progressService.getPersonalRecords(),
        progressService.getMuscleGroupStats(dateParams),
      ]);
      
      setOverview(overviewData);
      setVolumeTrend(volumeData.data_points);
      setPersonalRecords(recordsData.records);
      setMuscleGroups(muscleData.muscle_groups);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (selectedPeriod === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (selectedPeriod === 'month') {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <ThemedText type="title">Progress</ThemedText>
      </ThemedView>
      
      {isLoading ? (
        <ThemedView style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </ThemedView>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <ThemedView style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.selectedPeriodButton,
              ]}
              onPress={() => setSelectedPeriod('week')}>
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'week' && styles.selectedPeriodText,
                ]}>
                Week
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.selectedPeriodButton,
              ]}
              onPress={() => setSelectedPeriod('month')}>
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'month' && styles.selectedPeriodText,
                ]}>
                Month
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'year' && styles.selectedPeriodButton,
              ]}
              onPress={() => setSelectedPeriod('year')}>
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'year' && styles.selectedPeriodText,
                ]}>
                Year
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Overview metrics */}
          {overview && (
            <ThemedView style={styles.overviewContainer}>
              <ThemedView style={styles.metricRow}>
                <MetricCard
                  title="Workouts"
                  value={overview.workout_count.toString()}
                  color="#4A90E2"
                />
                <MetricCard
                  title="Total Volume"
                  value={`${Math.round(overview.total_volume).toLocaleString()}kg`}
                  color="#50C878"
                />
              </ThemedView>
              
              <ThemedView style={styles.metricRow}>
                <MetricCard
                  title="Avg Duration"
                  value={formatDuration(overview.avg_workout_duration)}
                  color="#9013FE"
                />
                <MetricCard
                  title="Records"
                  value={overview.personal_records_count.toString()}
                  color="#FF9500"
                />
              </ThemedView>
              
              <ThemedView style={styles.mostTrainedContainer}>
                <ThemedText style={styles.mostTrainedLabel}>Most Trained Muscle:</ThemedText>
                <ThemedText style={styles.mostTrainedValue}>{overview.most_trained_muscle}</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {/* Volume Trend Chart */}
          <ThemedView style={styles.chartContainer}>
            <ThemedText style={styles.sectionTitle}>Total Volume Trend</ThemedText>
            
            {volumeTrend.length > 1 ? (
              <LineChart
                data={{
                  labels: volumeTrend.map(point => formatDate(point.date)),
                  datasets: [
                    {
                      data: volumeTrend.map(point => point.value),
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                yAxisSuffix="kg"
                chartConfig={{
                  backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
                  backgroundGradientFrom: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
                  backgroundGradientTo: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => 
                    colorScheme === 'dark' 
                      ? `rgba(255, 255, 255, ${opacity})` 
                      : `rgba(0, 122, 164, ${opacity})`,
                  labelColor: (opacity = 1) => 
                    colorScheme === 'dark' 
                      ? `rgba(255, 255, 255, ${opacity})` 
                      : `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: Colors[colorScheme].tint,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            ) : (
              <ThemedView style={styles.noDataContainer}>
                <ThemedText style={styles.noDataText}>
                  Not enough data to show volume trend.
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Personal Records */}
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Personal Records</ThemedText>
            
            {personalRecords.length > 0 ? (
              personalRecords.slice(0, 3).map((record, index) => (
                <ThemedView key={index} style={styles.recordItem}>
                  <ThemedView>
                    <ThemedText style={styles.recordExercise}>{record.exercise_name}</ThemedText>
                    <ThemedText style={styles.recordDate}>
                      {new Date(record.date).toLocaleDateString()}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.recordValue}>
                    <ThemedText style={styles.recordWeight}>{record.weight}kg</ThemedText>
                    <ThemedText style={styles.recordReps}>× {record.reps}</ThemedText>
                  </ThemedView>
                </ThemedView>
              ))
            ) : (
              <ThemedView style={styles.noDataContainer}>
                <ThemedText style={styles.noDataText}>
                  No personal records yet. Keep training!
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Muscle Group Heatmap */}
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Muscle Group Activity</ThemedText>
            
            {muscleGroups.length > 0 ? (
              muscleGroups
                .sort((a, b) => b.activity_level - a.activity_level)
                .slice(0, 5)
                .map((muscle, index) => (
                  <ThemedView key={index} style={styles.muscleItem}>
                    <ThemedText style={styles.muscleName}>{muscle.name}</ThemedText>
                    <ThemedView style={styles.progressBarContainer}>
                      <ThemedView
                        style={[
                          styles.progressBar,
                          {
                            width: `${muscle.activity_level}%`,
                            backgroundColor: getColorForActivity(muscle.activity_level),
                          },
                        ]}
                      />
                    </ThemedView>
                    <ThemedText style={styles.muscleVolume}>
                      {Math.round(muscle.volume)}kg
                    </ThemedText>
                  </ThemedView>
                ))
            ) : (
              <ThemedView style={styles.noDataContainer}>
                <ThemedText style={styles.noDataText}>
                  No muscle group data available yet.
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      )}
    </ThemedView>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  color: string;
}

function MetricCard({ title, value, color }: MetricCardProps) {
  return (
    <ThemedView style={[styles.metricCard, { borderLeftColor: color }]}>
      <ThemedText style={styles.metricTitle}>{title}</ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </ThemedView>
  );
}

// Helper function to get color based on activity level
function getColorForActivity(level: number): string {
  if (level >= 75) return '#4CD964'; // High activity - green
  if (level >= 50) return '#FFCC00'; // Medium activity - yellow
  if (level >= 25) return '#FF9500'; // Low-medium activity - orange
  return '#FF3B30'; // Low activity - red
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedPeriodButton: {
    backgroundColor: Colors.light.tint,
  },
  periodButtonText: {
    fontWeight: '500',
  },
  selectedPeriodText: {
    color: 'white',
    fontWeight: 'bold',
  },
  overviewContainer: {
    marginBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftWidth: 4,
  },
  metricTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mostTrainedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  mostTrainedLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  mostTrainedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chartContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
  },
  sectionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  recordExercise: {
    fontSize: 16,
    fontWeight: '500',
  },
  recordDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  recordValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  recordWeight: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordReps: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 4,
  },
  muscleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  muscleName: {
    width: 100,
    fontSize: 14,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  muscleVolume: {
    width: 60,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  noDataContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    opacity: 0.7,
    textAlign: 'center',
  },
});