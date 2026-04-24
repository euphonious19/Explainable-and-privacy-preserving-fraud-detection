# This directory holds pre-trained model artifacts.
# 
# Files in this directory (*.pkl, *.joblib, *.pt) are excluded from Git
# by .gitignore to avoid committing large binary files.
#
# To generate model files, run:
#   python training/train_fl_model.py
#
# If no model files are present, the backend automatically falls back
# to a calibrated mock model trained on synthetic data.
