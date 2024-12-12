"""allow email to be null

Revision ID: 0b99e613b456
Revises: ac4f7ff08281
Create Date: 2024-12-13 02:15:07.599932

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b99e613b456'
down_revision: Union[str, None] = 'ac4f7ff08281'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # 創建臨時表
    op.create_table(
        'users_temp',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('username', sa.String(122), nullable=False),
        sa.Column('password', sa.String(128), nullable=False),
        sa.Column('email', sa.String(100), nullable=True),
        sa.Column('profile_image', sa.String(120), nullable=True)
    )
    
    # 將數據從原表複製到臨時表
    op.execute('INSERT INTO users_temp (id, username, password, email, profile_image) SELECT id, username, password, email, profile_image FROM users')
    
    # 刪除原表
    op.drop_table('users')
    
    # 將臨時表重命名為原表
    op.rename_table('users_temp', 'users')

def downgrade():
    # 創建原表
    op.create_table(
        'users_temp',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('username', sa.String(122), nullable=False),
        sa.Column('password', sa.String(128), nullable=False),
        sa.Column('email', sa.String(100), nullable=False),
        sa.Column('profile_image', sa.String(120), nullable=True)
    )
    
    # 將數據從現有表複製到臨時表
    op.execute('INSERT INTO users_temp (id, username, password, email, profile_image) SELECT id, username, password, email, profile_image FROM users')
    
    # 刪除現有表
    op.drop_table('users')
    
    # 將臨時表重命名為原表
    op.rename_table('users_temp', 'users')