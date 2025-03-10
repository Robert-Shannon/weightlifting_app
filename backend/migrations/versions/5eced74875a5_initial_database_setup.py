"""initial database setup

Revision ID: 5eced74875a5
Revises: 
Create Date: 2025-02-27 20:45:35.033842

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5eced74875a5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('exercise',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('short_youtube_demonstration', sa.String(), nullable=True),
    sa.Column('in_depth_youtube_explanation', sa.String(), nullable=True),
    sa.Column('difficulty_level', sa.String(), nullable=True),
    sa.Column('target_muscle_group', sa.String(), nullable=False),
    sa.Column('prime_mover_muscle', sa.String(), nullable=True),
    sa.Column('secondary_muscle', sa.String(), nullable=True),
    sa.Column('tertiary_muscle', sa.String(), nullable=True),
    sa.Column('primary_equipment', sa.String(), nullable=True),
    sa.Column('primary_items_count', sa.Integer(), nullable=True),
    sa.Column('secondary_equipment', sa.String(), nullable=True),
    sa.Column('secondary_items_count', sa.Integer(), nullable=True),
    sa.Column('posture', sa.String(), nullable=True),
    sa.Column('single_or_double_arm', sa.String(), nullable=True),
    sa.Column('continuous_or_alternating_arms', sa.String(), nullable=True),
    sa.Column('grip', sa.String(), nullable=True),
    sa.Column('load_position_ending', sa.String(), nullable=True),
    sa.Column('continuous_or_alternating_legs', sa.String(), nullable=True),
    sa.Column('foot_elevation', sa.Boolean(), nullable=True),
    sa.Column('combination_exercises', sa.Boolean(), nullable=True),
    sa.Column('movement_pattern_1', sa.String(), nullable=True),
    sa.Column('movement_pattern_2', sa.String(), nullable=True),
    sa.Column('movement_pattern_3', sa.String(), nullable=True),
    sa.Column('plane_of_motion_1', sa.String(), nullable=True),
    sa.Column('plane_of_motion_2', sa.String(), nullable=True),
    sa.Column('plane_of_motion_3', sa.String(), nullable=True),
    sa.Column('body_region', sa.String(), nullable=True),
    sa.Column('force_type', sa.String(), nullable=True),
    sa.Column('mechanics', sa.String(), nullable=True),
    sa.Column('laterality', sa.String(), nullable=True),
    sa.Column('primary_exercise_classification', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exercise_name'), 'exercise', ['name'], unique=False)
    op.create_index(op.f('ix_exercise_target_muscle_group'), 'exercise', ['target_muscle_group'], unique=False)
    op.create_table('users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('password_hash', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('workout_session',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('started_at', sa.DateTime(), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('active_duration', sa.Integer(), nullable=True),
    sa.Column('total_rest_duration', sa.Integer(), nullable=True),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('workout_template',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('workout_session_metrics',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('workout_session_id', sa.UUID(), nullable=False),
    sa.Column('day_of_week', sa.Integer(), nullable=True),
    sa.Column('time_of_day', sa.String(), nullable=True),
    sa.Column('start_hour', sa.Integer(), nullable=True),
    sa.Column('total_volume', sa.Float(), nullable=True),
    sa.Column('average_rest_between_sets', sa.Integer(), nullable=True),
    sa.Column('total_sets_completed', sa.Integer(), nullable=True),
    sa.Column('planned_vs_actual_duration_ratio', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['workout_session_id'], ['workout_session.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('workout_session_template',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('workout_session_id', sa.UUID(), nullable=False),
    sa.Column('workout_template_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['workout_session_id'], ['workout_session.id'], ),
    sa.ForeignKeyConstraint(['workout_template_id'], ['workout_template.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('workout_template_exercise',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('workout_template_id', sa.UUID(), nullable=False),
    sa.Column('exercise_id', sa.UUID(), nullable=False),
    sa.Column('order', sa.Integer(), nullable=False),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('superset_group_id', sa.String(), nullable=True),
    sa.Column('superset_order', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercise.id'], ),
    sa.ForeignKeyConstraint(['workout_template_id'], ['workout_template.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('workout_session_exercise',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('workout_session_id', sa.UUID(), nullable=False),
    sa.Column('exercise_id', sa.UUID(), nullable=False),
    sa.Column('order', sa.Integer(), nullable=False),
    sa.Column('workout_template_exercise_id', sa.UUID(), nullable=True),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('superset_group_id', sa.String(), nullable=True),
    sa.Column('superset_order', sa.Integer(), nullable=True),
    sa.Column('started_at', sa.DateTime(), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('active_duration', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercise.id'], ),
    sa.ForeignKeyConstraint(['workout_session_id'], ['workout_session.id'], ),
    sa.ForeignKeyConstraint(['workout_template_exercise_id'], ['workout_template_exercise.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('workout_template_set',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('workout_template_exercise_id', sa.UUID(), nullable=False),
    sa.Column('set_number', sa.Integer(), nullable=False),
    sa.Column('target_reps', sa.Integer(), nullable=False),
    sa.Column('target_weight', sa.Float(), nullable=True),
    sa.Column('is_warmup', sa.Boolean(), nullable=True),
    sa.Column('target_rest_time', sa.Integer(), nullable=True),
    sa.Column('is_superset_last_exercise', sa.Boolean(), nullable=True),
    sa.Column('tempo', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['workout_template_exercise_id'], ['workout_template_exercise.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('workout_set',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('workout_session_exercise_id', sa.UUID(), nullable=False),
    sa.Column('set_number', sa.Integer(), nullable=False),
    sa.Column('reps_completed', sa.Integer(), nullable=False),
    sa.Column('weight', sa.Float(), nullable=True),
    sa.Column('is_warmup', sa.Boolean(), nullable=True),
    sa.Column('rpe', sa.Integer(), nullable=True),
    sa.Column('started_at', sa.DateTime(), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('set_duration', sa.Integer(), nullable=True),
    sa.Column('rest_start_time', sa.DateTime(), nullable=True),
    sa.Column('rest_end_time', sa.DateTime(), nullable=True),
    sa.Column('actual_rest_time', sa.Integer(), nullable=True),
    sa.Column('tempo', sa.String(), nullable=True),
    sa.Column('time_under_tension', sa.Integer(), nullable=True),
    sa.Column('workout_template_set_id', sa.UUID(), nullable=True),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['workout_session_exercise_id'], ['workout_session_exercise.id'], ),
    sa.ForeignKeyConstraint(['workout_template_set_id'], ['workout_template_set.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('workout_set')
    op.drop_table('workout_template_set')
    op.drop_table('workout_session_exercise')
    op.drop_table('workout_template_exercise')
    op.drop_table('workout_session_template')
    op.drop_table('workout_session_metrics')
    op.drop_table('workout_template')
    op.drop_table('workout_session')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_exercise_target_muscle_group'), table_name='exercise')
    op.drop_index(op.f('ix_exercise_name'), table_name='exercise')
    op.drop_table('exercise')
    # ### end Alembic commands ###
